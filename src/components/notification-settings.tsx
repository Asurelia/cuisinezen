'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, BellOff, Clock, Shield, Smartphone, AlertTriangle, Check, X } from 'lucide-react';
import { notificationService, NotificationPreferences } from '@/services/notification.service';
import { useToast } from '@/hooks/use-toast';

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const prefs = notificationService.getPreferences();
      const permission = notificationService.getPermissionStatus();
      const subscribed = notificationService.isSubscribed();

      setPreferences(prefs);
      setPermissionStatus(permission);
      setIsSubscribed(subscribed);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les paramètres de notification',
        variant: 'destructive'
      });
    }
  };

  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      const granted = await notificationService.requestPermission();
      
      if (granted) {
        setPermissionStatus('granted');
        setIsSubscribed(true);
        toast({
          title: 'Notifications activées',
          description: 'Vous recevrez maintenant des notifications push',
        });
      } else {
        toast({
          title: 'Permission refusée',
          description: 'Les notifications ne peuvent pas être activées',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to request permission:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'activer les notifications',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      const success = await notificationService.unsubscribe();
      
      if (success) {
        setIsSubscribed(false);
        toast({
          title: 'Notifications désactivées',
          description: 'Vous ne recevrez plus de notifications push',
        });
      }
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de désactiver les notifications',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: any) => {
    if (!preferences) return;

    const newPreferences = {
      ...preferences,
      [key]: value
    };

    setPreferences(newPreferences);

    try {
      await notificationService.updatePreferences({ [key]: value });
      toast({
        title: 'Paramètres mis à jour',
        description: 'Vos préférences de notification ont été sauvegardées',
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les paramètres',
        variant: 'destructive'
      });
    }
  };

  const handleQuietHoursChange = (field: 'enabled' | 'start' | 'end', value: boolean | string) => {
    if (!preferences) return;

    const newQuietHours = {
      ...preferences.quietHours,
      [field]: value
    };

    handlePreferenceChange('quietHours', newQuietHours);
  };

  const sendTestNotification = async () => {
    try {
      await notificationService.showNotification({
        title: 'Test de notification CuisineZen',
        body: 'Si vous voyez ceci, les notifications fonctionnent correctement !',
        tag: 'test-notification',
        icon: '/icons/icon-192x192.png',
        data: { type: 'test' }
      });

      setTestNotificationSent(true);
      setTimeout(() => setTestNotificationSent(false), 3000);

      toast({
        title: 'Test envoyé',
        description: 'Une notification de test a été envoyée',
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer la notification de test',
        variant: 'destructive'
      });
    }
  };

  const getPermissionBadge = () => {
    switch (permissionStatus) {
      case 'granted':
        return <Badge variant="default" className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" />Autorisées</Badge>;
      case 'denied':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Bloquées</Badge>;
      default:
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />En attente</Badge>;
    }
  };

  if (!preferences) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Permission Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            État des notifications
          </CardTitle>
          <CardDescription>
            Gérez l'autorisation et l'état des notifications push
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Statut des permissions</span>
                {getPermissionBadge()}
              </div>
              <p className="text-sm text-muted-foreground">
                {permissionStatus === 'granted' 
                  ? 'Les notifications sont autorisées et fonctionnelles'
                  : permissionStatus === 'denied'
                  ? 'Les notifications sont bloquées dans votre navigateur'
                  : 'Cliquez pour autoriser les notifications'}
              </p>
            </div>
            
            <div className="flex gap-2">
              {permissionStatus !== 'granted' ? (
                <Button 
                  onClick={handleRequestPermission}
                  disabled={isLoading}
                  className="min-w-[120px]"
                >
                  {isLoading ? 'Activation...' : 'Activer'}
                </Button>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={sendTestNotification}
                    disabled={testNotificationSent}
                    className="min-w-[100px]"
                  >
                    {testNotificationSent ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Envoyé
                      </>
                    ) : (
                      'Tester'
                    )}
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleUnsubscribe}
                    disabled={isLoading}
                  >
                    Désactiver
                  </Button>
                </>
              )}
            </div>
          </div>

          {permissionStatus === 'denied' && (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Les notifications sont bloquées. Pour les réactiver, cliquez sur l'icône de cadenas dans la barre d'adresse de votre navigateur et autorisez les notifications.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Types de notifications
          </CardTitle>
          <CardDescription>
            Choisissez quels types de notifications vous souhaitez recevoir
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="notifications-enabled" className="font-medium">
                Notifications générales
              </Label>
              <p className="text-sm text-muted-foreground">
                Activer ou désactiver toutes les notifications
              </p>
            </div>
            <Switch
              id="notifications-enabled"
              checked={preferences.enabled}
              onCheckedChange={(checked) => handlePreferenceChange('enabled', checked)}
              disabled={permissionStatus !== 'granted'}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="expiry-alerts" className="font-medium">
                  Alertes d'expiration
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notifications pour les produits qui expirent
                </p>
              </div>
              <Switch
                id="expiry-alerts"
                checked={preferences.expiryAlerts}
                onCheckedChange={(checked) => handlePreferenceChange('expiryAlerts', checked)}
                disabled={!preferences.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="inventory-low" className="font-medium">
                  Stock faible
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notifications quand un produit est en rupture
                </p>
              </div>
              <Switch
                id="inventory-low"
                checked={preferences.inventoryLow}
                onCheckedChange={(checked) => handlePreferenceChange('inventoryLow', checked)}
                disabled={!preferences.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="recipe-updates" className="font-medium">
                  Mises à jour de recettes
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notifications pour les nouvelles recettes suggérées
                </p>
              </div>
              <Switch
                id="recipe-updates"
                checked={preferences.recipeUpdates}
                onCheckedChange={(checked) => handlePreferenceChange('recipeUpdates', checked)}
                disabled={!preferences.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="analytics-reports" className="font-medium">
                  Rapports d'analyse
                </Label>
                <p className="text-sm text-muted-foreground">
                  Rapports hebdomadaires sur vos économies
                </p>
              </div>
              <Switch
                id="analytics-reports"
                checked={preferences.analyticsReports}
                onCheckedChange={(checked) => handlePreferenceChange('analyticsReports', checked)}
                disabled={!preferences.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="marketing-updates" className="font-medium">
                  Actualités produit
                </Label>
                <p className="text-sm text-muted-foreground">
                  Nouvelles fonctionnalités et conseils
                </p>
              </div>
              <Switch
                id="marketing-updates"
                checked={preferences.marketingUpdates}
                onCheckedChange={(checked) => handlePreferenceChange('marketingUpdates', checked)}
                disabled={!preferences.enabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Heures silencieuses
          </CardTitle>
          <CardDescription>
            Définissez une période pendant laquelle vous ne souhaitez pas recevoir de notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="quiet-hours-enabled" className="font-medium">
                Activer les heures silencieuses
              </Label>
              <p className="text-sm text-muted-foreground">
                Aucune notification ne sera envoyée pendant cette période
              </p>
            </div>
            <Switch
              id="quiet-hours-enabled"
              checked={preferences.quietHours.enabled}
              onCheckedChange={(checked) => handleQuietHoursChange('enabled', checked)}
              disabled={!preferences.enabled}
            />
          </div>

          {preferences.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="quiet-start">Heure de début</Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={preferences.quietHours.start}
                  onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-end">Heure de fin</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={preferences.quietHours.end}
                  onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Confidentialité et sécurité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              • Vos données de notification sont chiffrées et stockées de manière sécurisée
            </p>
            <p>
              • Nous ne partageons jamais vos informations avec des tiers
            </p>
            <p>
              • Vous pouvez désactiver les notifications à tout moment
            </p>
            <p>
              • Les notifications sont traitées localement quand c'est possible
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}