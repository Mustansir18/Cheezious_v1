
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQRCode } from 'next-qrcode';
import { useSettings } from '@/context/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Utensils, ShoppingBag, Download, Image as ImageIcon, File as FileIcon, FileArchive, QrCode } from 'lucide-react';
import jsPDF from "jspdf";
import JSZip from 'jszip';
import { useToast } from '@/hooks/use-toast';
import { renderToStaticMarkup } from 'react-dom/server';


interface QRCodeDisplayProps {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  url: string;
  companyName: string;
  branchName: string;
  qrId: string;
}

const QRCodeDisplay = ({ title, subtitle, icon: Icon, url, companyName, branchName, qrId }: QRCodeDisplayProps) => {
  const { Canvas } = useQRCode();

  const generatePdf = useCallback(async () => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'px',
      format: [400, 600]
    });

    // Get QR code as data URL
    const qrCanvas = document.createElement('canvas');
    const qrContext = qrCanvas.getContext('2d');
    const qrImage = new Image();
    const qrSvg = document.querySelector(`#${qrId} canvas`);
    if(qrSvg) {
        const qrDataUrl = (qrSvg as HTMLCanvasElement).toDataURL('image/png');
        qrImage.src = qrDataUrl;
    }
    
    qrImage.onload = () => {
        // Company Name
        doc.setFontSize(32);
        doc.setFont('helvetica', 'bold');
        doc.text(companyName, doc.internal.pageSize.getWidth() / 2, 60, { align: 'center' });
        
        // Branch Name
        doc.setFontSize(18);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(153, 101, 21); // Amber-like color
        doc.text(branchName, doc.internal.pageSize.getWidth() / 2, 90, { align: 'center' });

        // QR Code
        doc.addImage(qrImage, 'PNG', 75, 120, 250, 250);

        // Icon (as SVG)
        const iconSvgString = renderToStaticMarkup(<Icon className="h-12 w-12" color="#ffb700" strokeWidth={2}/>);
        doc.addSvgAsImage(iconSvgString, doc.internal.pageSize.getWidth() / 2 - 24, 400, 48, 48);

        // Title
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(title, doc.internal.pageSize.getWidth() / 2, 470, { align: 'center' });

        // Subtitle
        if (subtitle) {
            const formattedSubtitle = subtitle?.replace(/\s*-\s*/, ' ').replace(/\s+/g, ' ');
            doc.setFontSize(20);
            doc.setFont('helvetica', 'normal');
            doc.text(formattedSubtitle, doc.internal.pageSize.getWidth() / 2, 500, { align: 'center' });
        }

        // Footer Text
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text('Scan this code to begin your order.', doc.internal.pageSize.getWidth() / 2, 530, { align: 'center' });

        // Save
        doc.save(`${companyName}-${branchName}-${title}-${subtitle || 'qr'}.pdf`.toLowerCase().replace(/\s/g, '-'));
    };

  }, [Canvas, qrId, companyName, branchName, title, subtitle, Icon, url]);
  
  const generateCanvas = useCallback(async () => {
    const cardElement = document.getElementById(qrId);
    if (!cardElement) return null;
    
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(cardElement, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#f9f5ea', // A close approximation of the card background
      logging: false
    });
    return canvas;
  }, [qrId]);
  
  const downloadAsPng = useCallback(async () => {
    const canvas = await generateCanvas();
    if(canvas) {
      const link = document.createElement('a');
      link.download = `${companyName}-${branchName}-${title}-${subtitle || 'qr'}.png`.toLowerCase().replace(/\s/g, '-');
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  }, [generateCanvas, companyName, branchName, title, subtitle]);

  const formattedSubtitle = subtitle?.replace(/\s*-\s*/, ' ').replace(/\s+/g, ' ');

  return (
    <div className="flex flex-col items-center p-6 border-2 border-dashed rounded-xl break-inside-avoid bg-card">
      <div id={qrId} className="text-center w-full bg-card p-8 rounded-lg">
        <h3 className="text-3xl font-bold font-headline text-center text-primary">{companyName}</h3>
        <p className="text-amber-800 text-center mb-6 text-lg font-semibold">{branchName}</p>

        <div className="flex justify-center relative">
          <Canvas
            text={url}
            options={{
              type: 'image/png',
              quality: 1,
              errorCorrectionLevel: 'H',
              margin: 1,
              scale: 8,
              width: 256,
              color: { dark: '#000000FF', light: '#FFFFFFFF' },
            }}
          />
        </div>

        <div className="text-center mt-6">
          <Icon className="mx-auto h-12 w-12 text-primary" />
          <h4 className="mt-2 text-2xl font-bold">{title}</h4>
          {subtitle && <p className="text-xl font-semibold">{formattedSubtitle}</p>}
          <p className="text-muted-foreground mt-2">Scan this code to begin your order.</p>
        </div>
      </div>

      <div className="flex gap-2 mt-6 print-hidden w-full">
        <Button variant="outline" className="w-full" onClick={downloadAsPng}>
          <ImageIcon className="mr-2 h-4 w-4" /> PNG
        </Button>
        <Button variant="outline" className="w-full" onClick={generatePdf}>
          <Download className="mr-2 h-4 w-4" /> PDF
        </Button>
      </div>
    </div>
  );
};


export default function QRCodesPage() {
  const { settings, isLoading } = useSettings();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  const [origin, setOrigin] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
      if (settings.branches.length > 0) {
        setSelectedBranchId(settings.defaultBranchId || settings.branches[0].id);
      }
      if (settings.floors.length > 0) {
        setSelectedFloorId(settings.floors[0].id);
      }
    }
  }, [settings.defaultBranchId, settings.floors, settings.branches]);

  const { selectedBranch, selectedFloor, tablesForSelectedFloor } = useMemo(() => {
    const branch = settings.branches.find(b => b.id === selectedBranchId);
    const floor = settings.floors.find(f => f.id === selectedFloorId);
    if (!branch) return { selectedBranch: null, selectedFloor: null, tablesForSelectedFloor: [] };

    const tables = settings.tables.filter(t => t.floorId === selectedFloorId);
    
    return { selectedBranch: branch, selectedFloor: floor, tablesForSelectedFloor: tables };
  }, [selectedBranchId, selectedFloorId, settings.tables, settings.branches, settings.floors]);

  const exportAllAs = useCallback(async (format: 'pdf' | 'zip') => {
    if (!selectedBranch || !selectedFloor || tablesForSelectedFloor.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Please select a floor with tables to export.',
      });
      return;
    }
    
    toast({
        title: 'Export in Progress...',
        description: `Generating ${format.toUpperCase()} for ${tablesForSelectedFloor.length} tables. Please wait.`,
    });
    
    const { default: html2canvas } = await import('html2canvas');

    if (format === 'pdf') {
        const pdf = new jsPDF('p', 'px');
        let isFirstPage = true;

        for (const table of tablesForSelectedFloor) {
            const element = document.getElementById(`qr-card-${table.id}`);
            if (element) {
                const canvas = await html2canvas(element, { scale: 5, useCORS: true, backgroundColor: '#f9f5ea' });
                const imgData = canvas.toDataURL('image/png');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgProps = pdf.getImageProperties(imgData);
                const aspectRatio = imgProps.width / imgProps.height;
                let imgWidth = pdfWidth - 20;
                let imgHeight = imgWidth / aspectRatio;
                 if (imgHeight > pdfHeight - 20) {
                    imgHeight = pdfHeight - 20;
                    imgWidth = imgHeight * aspectRatio;
                }

                if (!isFirstPage) {
                    pdf.addPage();
                }
                pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
                isFirstPage = false;
            }
        }
        pdf.save(`${selectedBranch.name}-${selectedFloor.name}-QRCodes.pdf`.toLowerCase().replace(/\s/g, '-'));

    } else if (format === 'zip') {
        const zip = new JSZip();
        for (const table of tablesForSelectedFloor) {
            const element = document.getElementById(`qr-card-${table.id}`);
            if (element) {
                 try {
                    const canvas = await html2canvas(element, { scale: 5, useCORS: true, backgroundColor: '#f9f5ea' });
                    const fileName = `${settings.companyName}-${selectedBranch.name}-${selectedFloor.name}-${table.name}-QR.png`.toLowerCase().replace(/\s/g, '-');
                    const imgData = canvas.toDataURL('image/png').split(',')[1];
                    zip.file(fileName, imgData, {base64: true});
                } catch (error) {
                    console.error(`Failed to export table ${table.name} as PNG:`, error);
                    toast({ variant: 'destructive', title: 'Export Failed', description: `Could not generate PNG for table ${table.name}.` });
                }
            }
        }
         zip.generateAsync({ type: "blob" }).then(function(content) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `${selectedBranch.name}-${selectedFloor.name}-QRCodes.zip`.toLowerCase().replace(/\s/g, '-');
            link.click();
            URL.revokeObjectURL(link.href);
        });
    }
    toast({
        title: 'Export Complete!',
        description: `Your QR codes have been downloaded.`,
    });

  }, [tablesForSelectedFloor, selectedBranch, selectedFloor, settings.companyName, toast]);


  if (isLoading || !origin) {
    return <div>Loading...</div>;
  }

  const takeAwayUrl = `${origin}/branch/${selectedBranchId}/menu?mode=Take-Away`;

  return (
    <div className="w-full space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center print-hidden">
        <div>
          <h1 className="font-headline text-4xl font-bold">Printable QR Codes</h1>
          <p className="text-muted-foreground">
            Generate and print QR codes for tables and for Take Away orders.
          </p>
        </div>
      </header>

      <Card className="print-hidden">
        <CardContent className="pt-6">
          <Label htmlFor="branch-select">Select Branch</Label>
          <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
            <SelectTrigger id="branch-select" className="w-full md:w-[300px]">
              <SelectValue placeholder="Select a branch" />
            </SelectTrigger>
            <SelectContent>
              {settings.branches.map(branch => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      
      {selectedBranch && (
        <Tabs defaultValue="dine-in" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                <TabsTrigger value="dine-in" className="py-3 text-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Dine-In</TabsTrigger>
                <TabsTrigger value="take-away" className="py-3 text-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Take Away</TabsTrigger>
            </TabsList>

            <TabsContent value="take-away" className="mt-6">
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Take Away Orders</CardTitle>
                        <CardDescription>A general-purpose QR code for customers placing take away orders.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="max-w-sm mx-auto">
                            <QRCodeDisplay
                                title="Take Away"
                                icon={ShoppingBag}
                                url={takeAwayUrl}
                                companyName={settings.companyName}
                                branchName={selectedBranch.name}
                                qrId="qr-card-take-away"
                            />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="dine-in" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Dine-In Orders</CardTitle>
                        <CardDescription>Select a floor to view and print the QR codes for each table.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="print-hidden flex flex-wrap gap-4 items-end">
                            <div className="grid gap-1.5">
                                <Label htmlFor="floor-select">Select Floor</Label>
                                <Select value={selectedFloorId} onValueChange={setSelectedFloorId}>
                                    <SelectTrigger id="floor-select" className="w-full md:w-[300px]">
                                    <SelectValue placeholder="Select a floor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {settings.floors.map(floor => (
                                        <SelectItem key={floor.id} value={floor.id}>
                                        {floor.name}
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={() => exportAllAs('zip')} disabled={tablesForSelectedFloor.length === 0}>
                                    <FileArchive className="mr-2 h-4 w-4" /> Export All as ZIP
                                </Button>
                                <Button variant="secondary" onClick={() => exportAllAs('pdf')} disabled={tablesForSelectedFloor.length === 0}>
                                    <FileIcon className="mr-2 h-4 w-4" /> Export All as PDF
                                </Button>
                            </div>
                        </div>

                        <div className="columns-1 md:columns-2 xl:columns-3 gap-8 printable-grid">
                            {tablesForSelectedFloor.map(table => {
                                const floor = settings.floors.find(f => f.id === table.floorId);
                                return (
                                    <QRCodeDisplay
                                        key={table.id}
                                        title="Dine-In"
                                        subtitle={`${floor?.name || ''} - ${table.name}`}
                                        icon={Utensils}
                                        url={`${origin}/branch/${selectedBranchId}/menu?mode=Dine-In&tableId=${table.id}&floorId=${table.floorId}`}
                                        companyName={settings.companyName}
                                        branchName={selectedBranch.name}
                                        qrId={`qr-card-${table.id}`}
                                    />
                                )
                            })}
                        </div>
                        {tablesForSelectedFloor.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">No tables found for the selected floor. Add tables in the Admin Settings.</p>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
