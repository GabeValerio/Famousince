export const SERVER_MODELS = [
  {
    id: 'model1-short',
    name: 'Short Sleeve',
    imageUrl: '/MockUp/Model1_ShortSleeve.JPG',
  },
  {
    id: 'model1-hoodie',
    name: 'Hoodie Style 1',
    imageUrl: '/MockUp/Model1_Hoodie.JPG',
  },
  {
    id: 'model2-hoodie',
    name: 'Hoodie Style 2',
    imageUrl: '/MockUp/Model2_Hoodie.JPG',
  }
] as const;

export type ModelId = typeof SERVER_MODELS[number]['id']; 