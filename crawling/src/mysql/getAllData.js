import winLogger from '../util/winston.js';

import pool from './pool.js';

const queryGetAllTrackDataJoinedWithArtist = `SELECT 
artists.id AS artist_id,
artists.artistKey AS artist_key,
artists.artistKeyword AS artist_keyword,
artists.platforms AS artist_platforms,
tracks.id AS id,
tracks.trackKey AS trackKey,
tracks.titleKeyword AS titleKeyword,
tracks.lyrics AS lyrics,
JSON_OBJECT(
    'genie', JSON_OBJECT('trackInfo', JSON_EXTRACT(tracks.platforms, '$.genie.trackInfo')),
    'bugs', JSON_OBJECT('trackInfo', JSON_EXTRACT(tracks.platforms, '$.bugs.trackInfo')),
    'melon', JSON_OBJECT('trackInfo', JSON_EXTRACT(tracks.platforms, '$.melon.trackInfo'))
) AS platforms
FROM trackDetails
JOIN artists ON trackDetails.artistId = artists.id
JOIN tracks ON trackDetails.trackId = tracks.id;`;

const queryGetArtistsNoHasImage = `SELECT
id, artistKey, platforms 
FROM artists 
WHERE artistImage IS NULL
OR debut IS NULL;`;

export async function getAllTrackDataJoinedWithArtist() {
  const conn = await pool.getConnection();
  const queryResult = (await conn.query(queryGetAllTrackDataJoinedWithArtist))[0];
  winLogger.info('mysql data import success');
  conn.release();
  return queryResult;
}

export async function getArtistsNoHasAddInfo() {
  const conn = await pool.getConnection();
  const queryResult = (await conn.query(queryGetArtistsNoHasImage))[0];
  winLogger.info('mysql data import success');
  conn.release();
  return queryResult;
}
