const API_BASE_URL = __DEV__ 
  ? 'http://172.20.10.4:4000'  // Development - შენი კომპის LAN IP
  : 'https://your-production-api.com';// Production

export default API_BASE_URL;
