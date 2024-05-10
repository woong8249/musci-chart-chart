/* eslint-disable no-restricted-syntax */
/* eslint-disable no-shadow */

import fs from 'fs';
import path from 'path';

import * as bugs from '../platforms/domestic/bugs.js';
import * as genie from '../platforms/domestic/genie.js';
import * as melon from '../platforms/domestic/melon.js';
import {
  addAdditionalInfoToTracks,
  classifyTracks,
  mappingChartDataToTrack,
} from '../integrate/domestic/integrate.js';
import { extractYearMonthDay } from '../util/time';
import winLogger from '../util/winston';

const modules = { melon, bugs, genie };

export default async function crawlingDomesticPlatformCharts(startDate, endDate, chartType) {
  const fileName = Object.values(extractYearMonthDay(startDate)).reduce((pre, cur) => pre + cur, '')
   + '-' + Object.values(extractYearMonthDay(endDate)).reduce((pre, cur) => pre + cur, '') + '-' + chartType;
  const filePath = path.join(__dirname, '../integrate/domestic/dataBeforeIntegration', `${fileName}.json`);

  const startTimeCrawling = new Date();
  winLogger.info('Start chart crawling and classification', { startDate, endDate, chartType });
  const firstCrawlingPromises = Object.entries(modules)
    .map(([key, value]) => value.fetchChartsForDateRangeInParallel(startDate, endDate, chartType)
      .then(async result => {
        const classifiedTracks = classifyTracks(await mappingChartDataToTrack(result), key);
        winLogger.debug(`Number of tracks on ${key} platform`, { numberOfTracks: Object.keys(classifiedTracks).length });
        return classifiedTracks;
      }));
  const [melon, bugs, genie] = await Promise.all(firstCrawlingPromises);
  const endTimeCrawling = new Date();
  winLogger.info('End chart crawling and classification');
  winLogger.info(`Chart crawling and classification took ${(endTimeCrawling - startTimeCrawling) / 1000} seconds`);

  const startTimeAdditionalInfo = new Date();
  winLogger.info('Start crawling additional track information');
  const addInfoCrawlingPromises = Object.entries({ melon, bugs, genie })
    .map(([key, value]) => addAdditionalInfoToTracks(value, key));
  const result = await Promise.all(addInfoCrawlingPromises);
  const endTimeAdditionalInfo = new Date();
  winLogger.info('End crawling additional track information');
  winLogger.info(`Crawling additional track information took ${(endTimeAdditionalInfo - startTimeAdditionalInfo) / 1000} seconds`);
  fs.writeFileSync(filePath, JSON.stringify(result));
  return result;
}
