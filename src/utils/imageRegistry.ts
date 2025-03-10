import { Image, Platform } from 'react-native';
import {CATEGORY_IMAGE_PATHS,SUBCATEGORY_IMAGE_PATHS} from './imagePaths';

 
export interface ImageMapping {
  id: string;
  imageUrl: number;  // Changed to number for React Native require
}

export interface CategoryImage {
  id: string;
  code: string;
  description: string;
  imageUrl: string;
}

export interface SubCategoryImage {
  id: string;
  code: string;
  description: string;
  imageUrl: string | null;
  parentCategoryId?: string;
}

export interface ImageResponse {
  categories: ImageMapping[];
  subcategories: ImageMapping[];
}

class ImageRegistry {
  private static instance: ImageRegistry;
  private categoryImageCache: Map<string, { type: 'local', source: number }> = new Map();
  private subcategoryImageCache: Map<string, { type: 'local', source: number }> = new Map();
  private imageLoadPromises: Map<string, Promise<boolean>> = new Map();

  private constructor() {
    // Populate caches with require() statements
    Object.entries(CATEGORY_IMAGE_PATHS).forEach(([key, value]) => {
      this.categoryImageCache.set(key, { type: 'local', source: value });
    });

    Object.entries(SUBCATEGORY_IMAGE_PATHS).forEach(([key, value]) => {
      this.subcategoryImageCache.set(key, { type: 'local', source: value });
    });
  }

  private async prefetchImage(imageSource: number): Promise<boolean> {
    try {
      if (Platform.OS === 'web') return true;

      const resolvedSource = Image.resolveAssetSource(imageSource);
      if (!resolvedSource?.uri) return false;
      
      return await Image.prefetch(resolvedSource.uri);
    } catch (error) {
      console.warn('Error prefetching image:', error);
      return false;
    }
  }

  public static getInstance(): ImageRegistry {
    if (!ImageRegistry.instance) {
      ImageRegistry.instance = new ImageRegistry();
    }
    return ImageRegistry.instance;
  }

  public getCategoryImage(categoryId: string): number | null {
    const key = `C${categoryId}`;
    const cachedImage = this.categoryImageCache.get(key);
    
    if (cachedImage?.type === 'local') {
      this.prefetchImage(cachedImage.source).catch(console.warn);
      return cachedImage.source;
    }
    
    return null;
  }

  public getSubcategoryImage(subcategoryId: string): number | null {
    const key = `SC${subcategoryId}`;
    const cachedImage = this.subcategoryImageCache.get(key);
    
    if (cachedImage?.type === 'local') {
      this.prefetchImage(cachedImage.source).catch(console.warn);
      return cachedImage.source;
    }
    
    return null;
  }

  public getLocalImageMappings(): ImageResponse {
    const categories: ImageMapping[] = Array.from(this.categoryImageCache.entries())
      .filter(([_, value]) => value !== null && value.type === 'local')
      .map(([key, value]) => ({
        id: key.replace('C', ''),
        imageUrl: value.source
      }));

    const subcategories: ImageMapping[] = Array.from(this.subcategoryImageCache.entries())
      .filter(([_, value]) => value !== null && value.type === 'local')
      .map(([key, value]) => ({
        id: key.replace('SC', ''),
        imageUrl: value.source
      }));

    return { categories, subcategories };
  }
}

export const fetchImageMappings = async (): Promise<ImageResponse> => {
  try {
    return ImageRegistry.getInstance().getLocalImageMappings();
  } catch (error) {
    console.error('Error getting image mappings:', error);
    return { categories: [], subcategories: [] };
  }
};

export const getCategoryImage = (categoryId: string): number | null => {
  return ImageRegistry.getInstance().getCategoryImage(categoryId);
};

export const getSubcategoryImage = (subcategoryId: string): number | null => {
  return ImageRegistry.getInstance().getSubcategoryImage(subcategoryId);
};

export const formatImageName = (id: string, isCategory: boolean = true): string => {
  const prefix = isCategory ? 'C' : 'SC';
  return `${prefix}${id}.jpg`;
};

export const formatCategories = (categories: any[]): CategoryImage[] => {
  return categories
    .map(category => {
      const image = ImageRegistry.getInstance().getCategoryImage(category.CATID);
      if (!image) return null;
      
      return {
        id: category.CATID,
        code: category.CATCODE,
        description: category.CATDESC,
        imageUrl: formatImageName(category.CATID, true)
      };
    })
    .filter((category): category is CategoryImage => category !== null);
};
 

export const formatSubCategories = (subcategories: any[]): SubCategoryImage[] => {
  return subcategories
    .map((subcategory) => {
      try {
        // Get the image and check if it exists
        const imageRegistry = ImageRegistry.getInstance();
        const image = imageRegistry.getSubcategoryImage(subcategory.SUBCATID);
        
        // If no image is found, skip this subcategory
        if (!image) {
          console.log(`No image found for subcategory ${subcategory.SUBCATID}`);
          return null;
        }

        // If image exists, return the formatted subcategory
        const formattedSubCategory: SubCategoryImage = {
          id: subcategory.SUBCATID,
          code: subcategory.SUBCATCODE,
          description: subcategory.SUBCATDESC,
          imageUrl: formatImageName(subcategory.SUBCATID, false),
          parentCategoryId: subcategory.CATID
        };

        return formattedSubCategory;
      } catch (error) {
        console.error(`Error formatting subcategory ${subcategory.SUBCATID}:`, error);
        return null;
      }
    })
    .filter((subcategory): subcategory is SubCategoryImage => subcategory !== null);
};
