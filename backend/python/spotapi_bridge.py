import sys
import json
import re
from typing import Dict, Any, List, Optional
from spotapi import Public, PublicAlbum, PublicPlaylist


def parse_spotify_url(url: str) -> tuple[Optional[str], Optional[str]]:
    """Extract media type ('track', 'album', 'playlist') and ID from URL or URI."""
    url = url.strip()
    match = re.search(r'(track|album|playlist)[/:]([a-zA-Z0-9]+)', url)
    if match:
        return match.group(1), match.group(2)
    return None, None


def fetch_track(track_id: str) -> Dict[str, Any]:
    res = Public.song_info(track_id)
    track_data = res.get("data", {}).get("trackUnion", {})
    if not track_data or track_data.get("__typename") != "Track":
        raise ValueError(f"Track with ID '{track_id}' not found or unavailable.")

    track_name = track_data.get("name", "Unknown Track")
    duration_ms = track_data.get("duration", {}).get("totalMilliseconds", 0)

    # Extract artists from firstArtist + otherArtists
    artists: List[Dict[str, str]] = []
    first_artists = track_data.get("firstArtist", {}).get("items", [])
    other_artists = track_data.get("otherArtists", {}).get("items", [])
    for a in first_artists + other_artists:
        name = a.get("profile", {}).get("name")
        if name and not any(existing["name"] == name for existing in artists):
            artists.append({"name": name})
    if not artists:
        artists = [{"name": "Unknown Artist"}]

    # Extract album info
    album_data = track_data.get("albumOfTrack", {})
    album_name = album_data.get("name", "Single")
    album_id = album_data.get("id", "")
    cover_sources = album_data.get("coverArt", {}).get("sources", [])
    album_image = cover_sources[0].get("url") if cover_sources else None

    track_obj = {
        "id": track_id,
        "name": track_name,
        "artists": artists,
        "album": {
            "id": album_id,
            "name": album_name,
            "image": album_image,
        },
        "duration_ms": duration_ms,
        "uri": f"spotify:track:{track_id}",
    }

    return {
        "id": track_id,
        "type": "track",
        "name": track_name,
        "description": f"Track by {', '.join(a['name'] for a in artists)}",
        "owner": artists[0]["name"],
        "image": album_image,
        "tracks_count": 1,
        "tracks": [track_obj],
    }


def fetch_album(album_id: str) -> Dict[str, Any]:
    album = PublicAlbum(album_id)
    info = album.get_album_info(limit=100)
    album_data = info.get("data", {}).get("albumUnion", {})
    if not album_data:
        raise ValueError(f"Album with ID '{album_id}' not found or unavailable.")

    album_name = album_data.get("name", "Unknown Album")
    cover_sources = album_data.get("coverArt", {}).get("sources", [])
    album_image = cover_sources[0].get("url") if cover_sources else None

    # Album-level artists
    album_artists: List[Dict[str, str]] = []
    for a in album_data.get("artists", {}).get("items", []):
        name = a.get("profile", {}).get("name")
        if name:
            album_artists.append({"name": name})
    owner = album_artists[0]["name"] if album_artists else "Unknown Artist"

    # Tracks are under "tracksV2" (not "tracks")
    tracks_container = album_data.get("tracksV2", {})
    raw_tracks = tracks_container.get("items", [])
    total_count = tracks_container.get("totalCount", len(raw_tracks))

    tracks: List[Dict[str, Any]] = []
    for item in raw_tracks:
        t = item.get("track", {})
        t_uri = t.get("uri", "")
        t_id = t_uri.split(":")[-1] if t_uri else ""
        t_name = t.get("name", "Unknown Track")
        t_duration = t.get("duration", {}).get("totalMilliseconds", 0)

        t_artists: List[Dict[str, str]] = []
        for a in t.get("artists", {}).get("items", []):
            name = a.get("profile", {}).get("name")
            if name:
                t_artists.append({"name": name})
        if not t_artists:
            t_artists = album_artists or [{"name": "Unknown Artist"}]

        tracks.append({
            "id": t_id,
            "name": t_name,
            "artists": t_artists,
            "album": {
                "id": album_id,
                "name": album_name,
                "image": album_image,
            },
            "duration_ms": t_duration,
            "uri": t_uri,
        })

    # Paginate if album has more than 100 tracks
    if total_count > len(tracks):
        try:
            offset = len(tracks)
            while offset < total_count:
                more_info = album.get_album_info(limit=100, offset=offset)
                more_items = (
                    more_info.get("data", {})
                    .get("albumUnion", {})
                    .get("tracksV2", {})
                    .get("items", [])
                )
                if not more_items:
                    break
                for item in more_items:
                    t = item.get("track", {})
                    t_uri = t.get("uri", "")
                    t_id = t_uri.split(":")[-1] if t_uri else ""
                    t_name = t.get("name", "Unknown Track")
                    t_duration = t.get("duration", {}).get("totalMilliseconds", 0)
                    t_artists_inner: List[Dict[str, str]] = []
                    for a in t.get("artists", {}).get("items", []):
                        name = a.get("profile", {}).get("name")
                        if name:
                            t_artists_inner.append({"name": name})
                    if not t_artists_inner:
                        t_artists_inner = album_artists or [{"name": "Unknown Artist"}]
                    tracks.append({
                        "id": t_id,
                        "name": t_name,
                        "artists": t_artists_inner,
                        "album": {"id": album_id, "name": album_name, "image": album_image},
                        "duration_ms": t_duration,
                        "uri": t_uri,
                    })
                offset += len(more_items)
        except Exception as e:
            sys.stderr.write(f"Warning: album pagination failed: {e}\n")

    return {
        "id": album_id,
        "type": "album",
        "name": album_name,
        "description": f"Album by {owner} \u2022 {len(tracks)} tracks",
        "owner": owner,
        "image": album_image,
        "tracks_count": len(tracks),
        "tracks": tracks,
    }


def fetch_playlist(playlist_id: str) -> Dict[str, Any]:
    playlist = PublicPlaylist(playlist_id)
    info = playlist.get_playlist_info(limit=25)
    playlist_data = info.get("data", {}).get("playlistV2", {})
    if not playlist_data:
        raise ValueError(f"Playlist with ID '{playlist_id}' not found or unavailable.")

    playlist_name = playlist_data.get("name", "Unknown Playlist")
    description = playlist_data.get("description", "")

    # Image from images.items[0].sources[0].url
    images = playlist_data.get("images", {}).get("items", [])
    cover_image = None
    if images and images[0].get("sources"):
        cover_image = images[0]["sources"][0].get("url")

    # Owner from ownerV2.data.name
    owner = (
        playlist_data.get("ownerV2", {}).get("data", {}).get("name", "Unknown")
    )

    tracks: List[Dict[str, Any]] = []

    # Use paginate_playlist to get all tracks across pages
    try:
        for batch in playlist.paginate_playlist():
            items = batch.get("items", []) if isinstance(batch, dict) else []
            for item in items:
                track_wrapper = item.get("itemV2", {})
                track_data = track_wrapper.get("data", {})
                if not track_data or track_data.get("__typename") != "Track":
                    continue

                t_name = track_data.get("name", "Unknown Track")
                t_uri = track_data.get("uri", "")
                t_id = t_uri.split(":")[-1] if t_uri else ""

                # Playlist tracks use "trackDuration" not "duration"
                t_duration = track_data.get("trackDuration", {}).get(
                    "totalMilliseconds", 0
                )

                t_artists: List[Dict[str, str]] = []
                for a in track_data.get("artists", {}).get("items", []):
                    name = a.get("profile", {}).get("name")
                    if name:
                        t_artists.append({"name": name})
                if not t_artists:
                    t_artists = [{"name": "Unknown Artist"}]

                album_data = track_data.get("albumOfTrack", {})
                a_name = album_data.get("name", "")
                a_sources = album_data.get("coverArt", {}).get("sources", [])
                a_image = a_sources[0].get("url") if a_sources else cover_image

                tracks.append({
                    "id": t_id,
                    "name": t_name,
                    "artists": t_artists,
                    "album": {"name": a_name, "image": a_image},
                    "duration_ms": t_duration,
                    "uri": t_uri,
                })
    except Exception as err:
        sys.stderr.write(f"Playlist pagination warning: {err}\n")

    return {
        "id": playlist_id,
        "type": "playlist",
        "name": playlist_name,
        "description": description,
        "owner": owner,
        "image": cover_image,
        "tracks_count": len(tracks),
        "tracks": tracks,
    }


def main():
    if len(sys.argv) < 2:
        sys.stderr.write(
            "Usage: python spotapi_bridge.py <spotify_url> OR <type> <id>\n"
        )
        sys.exit(1)

    arg1 = sys.argv[1]

    if len(sys.argv) == 3:
        media_type = arg1.lower()
        media_id = sys.argv[2]
    else:
        media_type, media_id = parse_spotify_url(arg1)

    if not media_type or not media_id:
        sys.stderr.write(
            f"Error: Could not determine media type and ID from input: {arg1}\n"
        )
        sys.exit(1)

    try:
        if media_type == "track":
            result = fetch_track(media_id)
        elif media_type == "album":
            result = fetch_album(media_id)
        elif media_type == "playlist":
            result = fetch_playlist(media_id)
        else:
            raise ValueError(f"Unsupported media type: '{media_type}'")

        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        sys.stderr.write(f"Error fetching {media_type}: {e}\n")
        sys.exit(2)


if __name__ == "__main__":
    main()
