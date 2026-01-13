
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMenu } from '@/context/MenuContext';
import { useSettings } from '@/context/SettingsContext';
import { useActivityLog } from '@/context/ActivityLogContext';
import { useCashierLog } from '@/context/CashierLogContext';
import { useRating } from '@/context/RatingContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Check, Loader, AlertTriangle, FileUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';


export default function MigrateDataPage() {
    const { users } = useAuth();
    const { menu } = useMenu();
    const { settings } = useSettings();
    const { logs: activityLogs } = useActivityLog();
    const { logs: cashierLogs } = useCashierLog();
    const { ratings } = useRating();
    const { toast } = useToast();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleMigration = async () => {
        setIsLoading(true);
        setError(null);
        setIsSuccess(false);

        const allData = {
            menuData: menu,
            settingsData: settings,
            usersData: users,
            activityLogsData: activityLogs,
            cashierLogsData: cashierLogs,
            ratingsData: ratings
        };
        
        try {
            const response = await fetch('/api/migrate-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(allData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'An unknown error occurred during migration.');
            }
            
            toast({
                title: 'Migration Successful!',
                description: 'Your application data has been migrated to the SQL database.'
            });
            setIsSuccess(true);
        } catch (e: any) {
            setError(e.message);
            toast({
                variant: 'destructive',
                title: 'Migration Failed',
                description: e.message
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const dataSources = [
        { name: 'Settings', count: Object.keys(settings).length, loaded: !useSettings().isLoading },
        { name: 'Menu', count: menu.items.length, loaded: !useMenu().isLoading },
        { name: 'Users', count: users.length, loaded: !useAuth().isLoading },
        { name: 'Activity Logs', count: activityLogs.length, loaded: !useActivityLog().isLoading },
        { name: 'Cashier Logs', count: cashierLogs.length, loaded: !useCashierLog().isLoading },
        { name: 'Ratings', count: ratings.length, loaded: !useRating().isLoading },
    ];
    
    const allDataLoaded = dataSources.every(d => d.loaded);

    return (
        <div className="w-full max-w-2xl mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileUp className="h-6 w-6" />
                        Migrate Local Data to SQL Database
                    </CardTitle>
                    <CardDescription>
                        This tool will transfer all data currently stored in your browser's local storage to your configured SQL Server database. This is a one-time process.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 border-l-4 border-yellow-500 rounded-r-lg">
                        <p className="font-bold flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5"/> Important
                        </p>
                        <p className="text-sm mt-1">This process will first **DELETE ALL DATA** from the database tables to ensure a clean migration. Make sure you have backed up any existing database data if necessary.</p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-2">Data Sources to Migrate:</h3>
                        <ul className="space-y-1 list-disc list-inside text-sm">
                            {dataSources.map(source => (
                                <li key={source.name} className="flex justify-between items-center">
                                    <span>{source.name}</span>
                                    {source.loaded ? 
                                        <span className="flex items-center gap-2 text-green-600"><Check className="h-4 w-4" /> Loaded ({source.count} records)</span> :
                                        <span className="flex items-center gap-2 text-muted-foreground"><Loader className="h-4 w-4 animate-spin" /> Loading...</span>
                                    }
                                </li>
                            ))}
                        </ul>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col items-stretch gap-4">
                    {isSuccess && (
                        <div className="p-4 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-lg text-center">
                            <p className="font-bold">Migration Complete!</p>
                            <p className="text-sm">You can now proceed to the login page.</p>
                            <Button onClick={() => router.push('/login')} className="mt-2">Go to Login</Button>
                        </div>
                    )}
                     {error && (
                        <div className="p-4 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-lg text-center">
                            <p className="font-bold">Migration Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <Button onClick={handleMigration} disabled={isLoading || !allDataLoaded || isSuccess}>
                        {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Migrating...' : 'Start Migration'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
