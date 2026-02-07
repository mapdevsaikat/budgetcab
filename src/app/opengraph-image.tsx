import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';
export const alt = 'Budget Cabs Service - Affordable Nashik to Mumbai/Pune/Shirdi/Malegaon Taxi Service';
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
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a', // Dark background base
          backgroundImage: 'linear-gradient(135deg, #7f1d1d 0%, #0f172a 60%)', // Deep red to dark
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Abstract Background Pattern */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(220, 38, 38, 0.15) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            left: '-10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Content Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '60px 80px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            maxWidth: '90%',
          }}
        >
          {/* Logo / Icon Area */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              backgroundColor: '#dc2626',
              borderRadius: '20px',
              marginBottom: '32px',
              boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.5)',
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </div>

          {/* Main Title */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <span
              style={{
                fontSize: 64,
                fontWeight: 800,
                background: 'linear-gradient(to right, #fff, #e2e8f0)',
                backgroundClip: 'text',
                color: 'transparent',
                letterSpacing: '-0.02em',
              }}
            >
              Budget
            </span>
            <span
              style={{
                fontSize: 64,
                fontWeight: 800,
                color: '#fbbf24', // Amber-400
                marginLeft: '16px',
                letterSpacing: '-0.02em',
              }}
            >
              Cabs
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 30,
              color: '#94a3b8',
              textAlign: 'center',
              fontWeight: 500,
              marginBottom: '40px',
              maxWidth: '600px',
              lineHeight: 1.4,
            }}
          >
            Premium Intercity & Local Car Rental Services
          </div>

          {/* Features / Badges */}
          <div style={{ display: 'flex', gap: '24px' }}>
            {[
              'Clean Cars',
              'On Time',
              'Affordable',
              'Secure'
            ].map((feature, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '100px',
                  fontSize: 18,
                  color: '#e2e8f0',
                  fontWeight: 500,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#64748b',
            fontSize: 18,
            fontWeight: 500,
          }}
        >
          <span>Mumbai</span>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#64748b' }} />
          <span>Nashik</span>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#64748b' }} />
          <span>Pune</span>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#64748b' }} />
          <span>Shirdi</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
