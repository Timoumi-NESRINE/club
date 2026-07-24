import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { prisma } from '@/lib/prisma';
import { 
  Search, 
  Filter, 
  Plus, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Info,
  AlertCircle,
  Clock,
  CheckSquare,
  Trash2,
  RefreshCw
} from 'lucide-react';

export default function MonitoringSystem() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);

  const [formData, setFormData] = useState({
    type: 'INFO',
    source: 'system',
    message: '',
    severity: 'LOW',
    metadata: ''
  });

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, searchTerm, severityFilter, sourceFilter, statusFilter]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await prisma.systemAlert.findMany({
        include: { resolver: true },
        orderBy: { createdAt: 'desc' }
      });
      setAlerts(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAlerts = () => {
    let filtered = [...alerts];

    if (searchTerm) {
      filtered = filtered.filter(alert =>
        alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.source.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (severityFilter !== 'ALL') {
      filtered = filtered.filter(alert => alert.severity === severityFilter);
    }

    if (sourceFilter !== 'ALL') {
      filtered = filtered.filter(alert => alert.source === sourceFilter);
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(alert => alert.status === statusFilter);
    }

    setFilteredAlerts(filtered);
  };

  const handleCreateAlert = async () => {
    try {
      await prisma.systemAlert.create({
        data: {
          ...formData,
          metadata: formData.metadata ? JSON.parse(formData.metadata) : null
        }
      });
      await loadAlerts();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await prisma.systemAlert.update({
        where: { id: alertId },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolvedBy: user?.id
        }
      });
      await loadAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const handleIgnoreAlert = async (alertId) => {
    try {
      await prisma.systemAlert.update({
        where: { id: alertId },
        data: { status: 'IGNORED' }
      });
      await loadAlerts();
    } catch (error) {
      console.error('Error ignoring alert:', error);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette alerte ?')) {
      try {
        await prisma.systemAlert.delete({ where: { id: alertId } });
        await loadAlerts();
      } catch (error) {
        console.error('Error deleting alert:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'INFO',
      source: 'system',
      message: '',
      severity: 'LOW',
      metadata: ''
    });
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-300 border-l-4 border-l-red-500';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-300 border-l-4 border-l-orange-500';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-300 border-l-4 border-l-yellow-500';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-300 border-l-4 border-l-blue-500';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'ERROR': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'WARNING': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'INFO': return <Info className="w-5 h-5 text-blue-600" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'bg-red-100 text-red-800 border-red-300';
      case 'RESOLVED': return 'bg-green-100 text-green-800 border-green-300';
      case 'IGNORED': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des alertes...</p>
        </div>
      </div>
    );
  }

  const openAlerts = alerts.filter(a => a.status === 'OPEN');
  const criticalAlerts = openAlerts.filter(a => a.severity === 'CRITICAL');
  const highAlerts = openAlerts.filter(a => a.severity === 'HIGH');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Système de Monitoring</h1>
            <p className="text-gray-600 mt-1">Surveillance et alertes du système</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadAlerts}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Alerte
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle alerte</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-4 mt-4">
                  <div>
                    <Label>Type</Label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="INFO">Info</option>
                      <option value="WARNING">Warning</option>
                      <option value="ERROR">Error</option>
                    </select>
                  </div>
                  <div>
                    <Label>Source</Label>
                    <select
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="system">Système</option>
                      <option value="email_agent">Agent Email</option>
                      <option value="lead_generation">Lead Generation</option>
                      <option value="marketing">Marketing</option>
                      <option value="sales">Sales</option>
                    </select>
                  </div>
                  <div>
                    <Label>Sévérité</Label>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="LOW">Basse</option>
                      <option value="MEDIUM">Moyenne</option>
                      <option value="HIGH">Haute</option>
                      <option value="CRITICAL">Critique</option>
                    </select>
                  </div>
                  <div>
                    <Label>Message *</Label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Description de l'alerte..."
                      className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                    />
                  </div>
                  <div>
                    <Label>Métadonnées (JSON)</Label>
                    <textarea
                      value={formData.metadata}
                      onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
                      placeholder='{"key": "value"}'
                      className="w-full px-3 py-2 border rounded-md min-h-[60px]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateAlert}>
                    Créer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className={criticalAlerts.length > 0 ? "border-l-4 border-l-red-500" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Alertes Critiques</p>
                  <p className="text-2xl font-bold text-red-600">{criticalAlerts.length}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card className={highAlerts.length > 0 ? "border-l-4 border-l-orange-500" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Alertes Hautes</p>
                  <p className="text-2xl font-bold text-orange-600">{highAlerts.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Alertes Ouvertes</p>
                  <p className="text-2xl font-bold">{openAlerts.length}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Résolues</p>
                  <p className="text-2xl font-bold text-green-600">{alerts.filter(a => a.status === 'RESOLVED').length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Critical Alerts Banner */}
        {criticalAlerts.length > 0 && (
          <Card className="mb-6 border-l-4 border-l-red-500 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900">
                    {criticalAlerts.length} alerte(s) critique(s) nécessite(nt) une attention immédiate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Rechercher par message, source..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="ALL">Toutes les sévérités</option>
                <option value="CRITICAL">Critique</option>
                <option value="HIGH">Haute</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="LOW">Basse</option>
              </select>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="ALL">Toutes les sources</option>
                <option value="system">Système</option>
                <option value="email_agent">Agent Email</option>
                <option value="lead_generation">Lead Generation</option>
                <option value="marketing">Marketing</option>
                <option value="sales">Sales</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="OPEN">Ouvert</option>
                <option value="RESOLVED">Résolu</option>
                <option value="IGNORED">Ignoré</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Alertes ({filteredAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Aucune alerte trouvée
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getTypeIcon(alert.type)}
                          <div className="font-semibold">{alert.source}</div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(alert.status)}`}>
                            {alert.status}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/50">
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-sm mt-2">{alert.message}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(alert.createdAt).toLocaleString('fr-FR')}</span>
                          </div>
                          {alert.resolvedAt && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              <span>Résolu le {new Date(alert.resolvedAt).toLocaleString('fr-FR')}</span>
                            </div>
                          )}
                          {alert.resolver && (
                            <div>
                              Par {alert.resolver.firstName} {alert.resolver.lastName}
                            </div>
                          )}
                        </div>
                        {alert.metadata && (
                          <div className="mt-2 p-2 bg-white/50 rounded text-xs font-mono">
                            {JSON.stringify(alert.metadata, null, 2)}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        {alert.status === 'OPEN' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleResolveAlert(alert.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckSquare className="w-4 h-4 mr-1" />
                              Résoudre
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleIgnoreAlert(alert.id)}
                            >
                              Ignorer
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
