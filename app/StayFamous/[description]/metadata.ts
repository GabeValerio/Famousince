import { Metadata } from 'next';

interface Props {
  params: {
    description: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Convert underscores back to spaces and decode URI component
  const description = decodeURIComponent(params.description).replace(/_+/g, ' ');
  
  const title = `Famous Since ${description}`;
  const sharedDescription = `Check out my Famous Since Moment: ${description}`;
  const url = `https://famousince.com/StayFamous/${params.description}`;
  
  return {
    title,
    description: sharedDescription,
    openGraph: {
      title,
      description: sharedDescription,
      url,
      images: [{
        url: 'https://res.cloudinary.com/dme5tinla/image/upload/v1751231082/og-image_umtqkj.png',
        width: 1200,
        height: 630,
        alt: `Famous Since ${description} - Custom T-Shirt`
      }]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: sharedDescription,
      images: ['https://res.cloudinary.com/dme5tinla/image/upload/v1751231082/og-image_umtqkj.png']
    }
  };
} 