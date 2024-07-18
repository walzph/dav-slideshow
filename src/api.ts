import * as luxon from 'luxon';

export interface ImagesApiResponse {
    img: string;
    exif: string;
};

export interface ExifApiResponse {
    date?: luxon.ToObjectOutput;
    orientation?: number;
}

export interface ErrorResponse {
  error: string;
}
