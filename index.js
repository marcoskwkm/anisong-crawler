const axios = require('axios')
const cheerio = require('cheerio')
const Promise = require('bluebird')
const url = require('url')
const util = require('util')
const fs = require('fs-extra')

const MAIN_URL = 'https://www.animesonglyrics.com/browse/'

const INDEXES = 'abcdefghijklmnopqrstuvwxyz'

const sanitizeText = (text) => {
  // remove &nbsp; spaces
  text = text.replace(/\u00a0/g, ' ')
  return text.trim()
}

const fixSongName = (name) => {
  const pos = name.indexOf('\n')
  if (pos !== -1) {
    return sanitizeText(name.substring(0, pos))
  } else {
    return sanitizeText(name)
  }
}

const getLyrics = async (songUrl) => {
  const response = await axios.get(songUrl)
  const lyrics = []
  const $ = cheerio.load(response.data)
  $('.correct').remove()
  $('br').replaceWith('\n')
  $('#tab1').each((_, item) => {
    const text = sanitizeText($(item).text())
    lyrics.push(text)
  })

  return lyrics.join('\n')
}

const getAnimeSongList = async (animeUrl) => {
  const response = await axios.get(animeUrl)
  const songList = []
  const $ = cheerio.load(response.data)
  $('#songlist > .list-group-item').each((_, item) => {
    const songName = $(item).text()
    const songUrl = $(item).attr('href')
    if (songUrl && songUrl !== '#') {
      songList.push({
        name: fixSongName(songName),
        lyrics: getLyrics(songUrl),
      })
    }
  })

  return Promise.map(songList, (song) => Promise.props(song))
}

const getAnimeListFromIndex = async (indexUrl) => {
  const response = await axios.get(indexUrl)
  const animeList = []
  const $ = cheerio.load(response.data)
  $('#songlist > .list-group-item').each((_, item) => {
    const animeName = sanitizeText($(item).text())
    const animeUrl = $(item).attr('href')
    animeList.push({
      name: animeName,
      songs: getAnimeSongList(animeUrl),
    })
  })

  return Promise.map(animeList, (anime) => Promise.props(anime))
}

const getAnimeList = async (mainUrl) => {
  const animeList = []
  for (const index of INDEXES) {
    const indexUrl = url.resolve(mainUrl, index)
    animeList.push(await getAnimeListFromIndex(indexUrl))
  }

  return animeList.flat()
}

try {
  getAnimeList(MAIN_URL).then((animeList) => {
    fs.writeJSON('./data.json', animeList)
      .then(() => {
        let songCount = 0
        for (const anime of animeList) {
          songCount += anime.songs.length
        }
        console.log(`Successully fetched ${animeList.length} animes and ${songCount} songs.`)
      })
  })
} catch (err) {
  console.log(err)
}
