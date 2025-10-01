import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

/**
 * Downloads a bundle from a URL to the local filesystem
 * @param url The URL to download from
 * @param localFilename The filename to save as (relative to app documents directory)
 * @returns Promise that resolves with the local file path
 */
export const downloadBundle = async (url: string, localFilename: string): Promise<string> => {
  if (Platform.OS === 'web') {
    throw new Error('downloadBundle is only available on native platforms');
  }
  
  // Determine the local file path
  const localPath = `${RNFS.DocumentDirectoryPath}/${localFilename}`;
  
  // Download the file
  try {
    const { promise } = RNFS.downloadFile({
      fromUrl: url,
      toFile: localPath,
      background: false,
    });
    
    const result = await promise;
    
    if (result.statusCode === 200) {
      console.log(`Successfully downloaded bundle to ${localPath}`);
      return localPath;
    } else {
      throw new Error(`Failed to download bundle: HTTP ${result.statusCode}`);
    }
  } catch (error) {
    console.error('Error downloading bundle:', error);
    throw error;
  }
};

/**
 * Check if a bundle exists in the local filesystem
 * @param localFilename The filename to check for (relative to app documents directory)
 * @returns Promise that resolves with a boolean indicating if the file exists
 */
export const bundleExists = async (localFilename: string): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return false;
  }
  
  const localPath = `${RNFS.DocumentDirectoryPath}/${localFilename}`;
  
  try {
    return await RNFS.exists(localPath);
  } catch (error) {
    console.error('Error checking if bundle exists:', error);
    return false;
  }
};