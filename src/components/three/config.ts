// Common assets configuration for three.js components
import { publicPath } from '../../modules/utils';

// Default background image (used if no upload)
export const DEFAULT_BACKGROUND_PATH = publicPath('/assets/images/wlop.jpg');

// Static environment cube map faces for skybox/refraction
export const DEFAULT_CUBE_FACES: [string, string, string, string, string, string] = [
  publicPath('/assets/images/px.png'),
  publicPath('/assets/images/nx.png'),
  publicPath('/assets/images/py.png'),
  publicPath('/assets/images/ny.png'),
  publicPath('/assets/images/pz.png'),
  publicPath('/assets/images/nz.png'),
]; 