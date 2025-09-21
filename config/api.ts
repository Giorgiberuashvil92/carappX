// ავტომატურად განვსაზღვრავთ API URL-ს environment-ის მიხედვით
const getApiUrl = () => {
  if (__DEV__) {
    // Development mode - production API ტესტირებისთვის
    return 'https://carappx.onrender.com'; // Render production URL
  } else {
    // Production mode - production ბექენდი
    return 'https://carappx.onrender.com'; // Render production URL
  }
};

const API_BASE_URL = getApiUrl();

console.log(`🌐 API URL: ${API_BASE_URL} (${__DEV__ ? 'Development' : 'Production'} mode)`);

export default API_BASE_URL;
