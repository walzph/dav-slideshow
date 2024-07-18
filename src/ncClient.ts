import axios from "axios";
import getConfig from 'next/config';

const { serverRuntimeConfig } = getConfig();

const nextcloudClient = new axios.Axios({
    baseURL: `${serverRuntimeConfig.davUrl}/remote.php/dav/files/${encodeURIComponent(serverRuntimeConfig.davUsername)}/${encodeURIComponent(serverRuntimeConfig.davAlbum)}/`,
    auth: {
      username: serverRuntimeConfig.davUsername,
      password: serverRuntimeConfig.davPassword,
    },
});

export const Album = serverRuntimeConfig.davAlbum;

export default nextcloudClient;