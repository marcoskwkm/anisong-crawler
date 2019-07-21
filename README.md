# Anisong Crawler

## WTF

This is a crawler for anime song lyrics from http://animesonglyrics.com.

## Usage

```
yarn install
yarn run crawler
```

This creates a `data.json` file with an array of `anime` objects. Each `anime` object contains a `name` field and a `songs` array. Each element in `songs` contains the `name` of the song and its `lyrics`.

## Issues

- The crawler doesn't save the type of the song (opening/ending/insert).
- Seasons and movies are all mixed together.