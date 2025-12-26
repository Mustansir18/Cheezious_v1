
'use server';

import QRCode from 'react-qr-code';

interface QRCodeGeneratorProps {
    value: string;
}

export async function QRCodeGenerator({ value }: QRCodeGeneratorProps) {
  if (!value) {
    return null;
  }

  return (
    <div style={{ background: 'white', padding: '16px' }}>
      <QRCode value={value} size={256} />
    </div>
  );
}
