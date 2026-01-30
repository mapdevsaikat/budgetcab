import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';
export const alt = 'Budget Cabs Service - Affordable Mumbai to Nashik Taxi Service';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 50%, #4B5563 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          position: 'relative',
        }}
      >
        {/* Background decorative elements */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at 20% 50%, rgba(255, 193, 7, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(0, 169, 157, 0.1) 0%, transparent 50%)',
          }}
        />
        
        {/* Logo placeholder */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '30px',
          }}
        >
          <div
            style={{
              width: '120px',
              height: '120px',
              background: 'white',
              borderRadius: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            }}
          >
            <span style={{ fontSize: '80px' }}>🚕</span>
          </div>
        </div>

        {/* Brand Name */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0',
              lineHeight: '1.2',
              textAlign: 'center',
            }}
          >
            Budget Cabs Service
          </h1>
          <div
            style={{
              fontSize: '32px',
              color: '#FFC107',
              marginTop: '10px',
              fontWeight: '600',
            }}
          >
            Affordable & Reliable
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '36px',
            color: 'rgba(255, 255, 255, 0.95)',
            textAlign: 'center',
            marginTop: '20px',
            maxWidth: '900px',
            lineHeight: '1.4',
          }}
        >
          Affordable Intercity Taxi Service - Mumbai to Nashik
        </div>

        {/* Bottom text */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            fontSize: '24px',
            color: 'rgba(255, 255, 255, 0.8)',
            textAlign: 'center',
          }}
        >
          Mumbai Airport Transfers • Sharing Cabs • 24/7 Service
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

