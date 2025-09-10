import { useEffect } from 'react';
import Constants from 'expo-constants';

const Platform = Constants.platform;

export function useFrameworkReady() {
  useEffect(() => {
    if (Platform.OS === 'web' && window.frameworkReady) {
      window.frameworkReady();
    }
  });
}