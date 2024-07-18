import type { NextApiRequest, NextApiResponse } from 'next'
import nextcloudClient from '../../../ncClient';
import { Exifr } from 'exifr';
import * as luxon from 'luxon';
import { ErrorResponse, ExifApiResponse } from '@/api';

function parseDateTimeFromExif(data: {306: string, CreateDate: Date}): luxon.DateTime|undefined {
    let dt: luxon.DateTime|undefined;
    if (data.CreateDate) {
        dt = luxon.DateTime.fromJSDate(data.CreateDate);
    }
    else if (data["306"]) {
        // Sourced from https://www.cipa.jp/std/documents/e/DC-008-2012_E.pdf.
        dt = luxon.DateTime.fromFormat(data["306"], 'yyyy:LL:dd HH:mm:ss')
    }
    return dt?.invalidReason === null ? dt : undefined;
}

function parseOrientationFromExif(data: {Orientation: string}): number {
    // Map the orientation string to a corresponding numeric value
    const orientationMap: { [key: string]: number } = {
        'Normal': 1,
        'Rotate 90 CW': 6,
        'Rotate 180 CW': 3,
        'Rotate 270 CW': 8,
        'Flip Horizontal': 2,
        'Flip Vertical': 4,
        'Transpose': 5, // Flip Horizontal + Rotate 270 CW
        'Transverse': 7  // Flip Vertical + Rotate 90 CW
    };
    return orientationMap[data.Orientation] ?? 1;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExifApiResponse|ErrorResponse>,
) {
    const { imageName } = req.query;

    if (typeof imageName !== "string") {
        return res.status(400).send({error: "Invalid request"});
    }
    const exifr = new Exifr();
    return nextcloudClient.request({
      url: `/${imageName}`,
      method: 'GET',
      responseEncoding: 'binary',
      responseType: 'arraybuffer',
    }).then(response => {
        res.setHeader('Cache-Control', 'public, max-age=600, immutable');
        return exifr.read(response.data);

    }).then(() => {
        return exifr.parse();
    }).then(exifrData=> {
        const date = parseDateTimeFromExif(exifrData);
        const orientation = parseOrientationFromExif(exifrData);
        res.json({
            date: date?.toObject(),
            orientation: orientation,
        });
    }).catch(ex => {
        console.error(`Failed to get exif data from dav`, ex);
        res.status(500).json({error: "Failed to make request"});
    });
}