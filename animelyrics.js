// Crawler for animelyrics.com
// Not used because the website is very outdated.

const axios = require('axios')
const cheerio = require('cheerio')
const Promise = require('bluebird')
const url = require('url')
const util = require('util')
const fs = require('fs-extra')

const URL = 'https://www.animelyrics.com/anime'
const ANIME_URL = 'https://www.animelyrics.com/anime/lovelivesip'
const SONG_URL = 'https://www.animelyrics.com/anime/llsunshine/aozorajumping.htm'

const sanitizeText = (text) => {
  // remove &nbsp; spaces
  text = text.replace(/\u00a0/g, ' ')
  return text.trim()
}

const getLyrics = async (mainUrl, songUrl) => {
  const response = await axios.get(url.resolve(mainUrl, songUrl))
  const lyrics = []
  const $ = cheerio.load(response.data)
  $('dt').remove()
  $('.romaji > .lyrics').each((_, item) => {
    const text = sanitizeText($(item).text())
    lyrics.push(text)
  })
  return lyrics.join('\n')
}

const getAnimeSongList = async (mainUrl, animeUrl) => {
  const response = await axios.get(url.resolve(mainUrl, animeUrl))
  const songList = []
  const $ = cheerio.load(response.data)
  $('.mytable > tbody > tr > th > a').each((_, item) => {
    const songName = $(item).text().trim()
    const songUrl = $(item).attr('href')
    if (songUrl) {
      songList.push({
        name: songName,
        url: songUrl,
        lyrics: getLyrics(mainUrl, songUrl),
      })
    }
  })

  return Promise.map(songList, (song) => Promise.props(song))
}

const getAnimeList = async (mainUrl) => {
  const response = await axios.get(mainUrl)
  const animeList = []
  const $ = cheerio.load(response.data)
  const promiseList = []
  let count = 0
  $('.centerbox > table > tbody > tr > td > a').each((_, item) => {
    const animeName = $(item).text().trim()
    const animeUrl = $(item).attr('href')
    if (animeUrl) {
      animeList.push({
        name: animeName,
        url: animeUrl,
        songList: getAnimeSongList(mainUrl, animeUrl),
      })
      count += 1
    }
  })

  console.log(`Found ${count} animes. Starting fetch...`)
  return Promise.map(animeList, (anime) => Promise.props(anime))
}

getAnimeList(URL).then((animeList) => {
  fs.writeJSON('./data.json', animeList)
    .then(() => console.log('Success!'))
    .catch((error) => console.log(error))
})
// getAnimeSongList(URL, ANIME_URL).then((songList) => { console.log(songList) })
// getLyrics(URL, SONG_URL).then((lyrics) => console.log(lyrics))
