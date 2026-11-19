import { Platform } from 'react-native';
import { audioRecorder as webAudioRecorder } from './audioRecorder.web';
import { audioRecorder as nativeAudioRecorder } from './audioRecorder.native';

export const audioRecorder = Platform.OS === 'web' ? webAudioRecorder : nativeAudioRecorder;
