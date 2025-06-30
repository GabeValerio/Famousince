import { Metadata } from 'next';

interface Props {
  params: {
    description: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Convert underscores back to spaces and decode URI component
  const description = decodeURIComponent(params.description).replace(/_+/g, ' ');
  
  const title = `Check out my Famous Since Moment: Famous Since ${description}`;
  
  return {
    title,
    description: `Check out my Famous Since Moment: ${description}. Design and order custom t-shirts featuring your famous moment at Famousince.com`,
    openGraph: {
      title,
      description: `Check out my Famous Since Moment: ${description}. Design and order custom t-shirts featuring your famous moment at Famousince.com`,
      type: 'website',
      url: `https://famousince.com/StayFamous/${params.description}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: `Check out my Famous Since Moment: ${description}. Design and order custom t-shirts featuring your famous moment at Famousince.com`,
    }
  };
} 