import Reactotron from 'reactotron-react-native';
import { Platform } from 'react-native';

// Reactotron კონფიგურაცია
const reactotron = Reactotron
  .configure({
    name: 'CarAppX',
    host: Platform.OS === 'ios' ? 'localhost' : '10.0.2.2', // Android emulator-ისთვის
  })
  .useReactNative({
    asyncStorage: false,
    networking: {
      ignoreUrls: /symbolicate/,
    },
    editor: false,
    errors: { veto: (stackFrame) => false },
    overlay: false,
  })
  .connect();

// Console.log-ის გაუმჯობესება
const originalLog = console.log;
console.log = (...args) => {
  originalLog(...args);
  reactotron.log(...args);
};

// Console.error-ის გაუმჯობესება
const originalError = console.error;
console.error = (...args) => {
  originalError(...args);
  reactotron.error(...args);
};

// Console.warn-ის გაუმჯობესება
const originalWarn = console.warn;
console.warn = (...args) => {
  originalWarn(...args);
  reactotron.warn(...args);
};

export default reactotron;
