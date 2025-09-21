// ავტომატურად განვსაზღვრავთ API URL-ს environment-ის მიხედვით
const getApiUrl = () => {
  if (__DEV__) {
    // Development mode - ლოკალური ბექენდი
    return 'http://172.20.10.4:4000'; // შენი კომპის LAN IP
  } else {
    // Production mode - production ბექენდი
    return 'https://carappx-backend.onrender.com'; // Render production URL
  }
};

const API_BASE_URL = getApiUrl();

console.log(`🌐 API URL: ${API_BASE_URL} (${__DEV__ ? 'Development' : 'Production'} mode)`);

export default API_BASE_URL;
