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
  Edit, 
  Trash2, 
  Calendar,
  Image as ImageIcon,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Share2,
  Mail,
  Linkedin
} from 'lucide-react';

export default function MarketingAutomation() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'social_media',
    platform: 'facebook',
    status: 'DRAFT',
    content: '',
    imageUrl: '',
    scheduledFor: ''
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    filterCampaigns();
  }, [campaigns, searchTerm, statusFilter, typeFilter, platformFilter]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await prisma.marketingCampaign.findMany({
        include: { creator: true },
        orderBy: { createdAt: 'desc' }
      });
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCampaigns = () => {
    let filtered = [...campaigns];

    if (searchTerm) {
      filtered = filtered.filter(campaign =>
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(campaign => campaign.status === statusFilter);
    }

    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(campaign => campaign.type === typeFilter);
    }

    if (platformFilter !== 'ALL') {
      filtered = filtered.filter(campaign => campaign.platform === platformFilter);
    }

    setFilteredCampaigns(filtered);
  };

  const handleCreateCampaign = async () => {
    try {
      await prisma.marketingCampaign.create({
        data: {
          ...formData,
          scheduledFor: formData.scheduledFor ? new Date(formData.scheduledFor) : null,
          createdBy: user?.id
        }
      });
      await loadCampaigns();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  const handleUpdateCampaign = async () => {
    try {
      await prisma.marketingCampaign.update({
        where: { id: selectedCampaign.id },
        data: {
          ...formData,
          scheduledFor: formData.scheduledFor ? new Date(formData.scheduledFor) : null
        }
      });
      await loadCampaigns();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error updating campaign:', error);
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette campagne ?')) {
      try {
        await prisma.marketingCampaign.delete({ where: { id } });
        await loadCampaigns();
      } catch (error) {
        console.error('Error deleting campaign:', error);
      }
    }
  };

  const handlePublishCampaign = async (campaign) => {
    try {
      await prisma.marketingCampaign.update({
        where: { id: campaign.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date()
        }
      });
      await loadCampaigns();
    } catch (error) {
      console.error('Error publishing campaign:', error);
    }
  };

  const handleEditCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setFormData({
      name: campaign.name,
      type: campaign.type,
      platform: campaign.platform || '',
      status: campaign.status,
      content: campaign.content,
      imageUrl: campaign.imageUrl || '',
      scheduledFor: campaign.scheduledFor ? campaign.scheduledFor.toISOString().split('T')[0] : ''
    });
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'social_media',
      platform: 'facebook',
      status: 'DRAFT',
      content: '',
      imageUrl: '',
      scheduledFor: ''
    });
    setSelectedCampaign(null);
    setIsEditMode(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800 border-green-300';
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'DRAFT': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'ARCHIVED': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'social_media': return <Share2 className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'blog': return <FileText className="w-4 h-4" />;
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      default: return <Share2 className="w-4 h-4" />;
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'facebook': return '📘';
      case 'instagram': return '📷';
      case 'linkedin': return '💼';
      case 'email': return '📧';
      default: return '📢';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des campagnes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Automatisation Marketing</h1>
            <p className="text-gray-600 mt-1">Gérez vos campagnes marketing et contenu</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Campagne
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? 'Modifier la Campagne' : 'Créer une nouvelle Campagne'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4 mt-4">
                <div>
                  <Label>Nom de la campagne *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Campagne Printemps 2024"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="social_media">Réseaux sociaux</option>
                      <option value="email">Email</option>
                      <option value="blog">Blog</option>
                      <option value="linkedin">LinkedIn</option>
                    </select>
                  </div>
                  <div>
                    <Label>Plateforme</Label>
                    <select
                      value={formData.platform}
                      onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Statut</Label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="DRAFT">Brouillon</option>
                    <option value="SCHEDULED">Programmé</option>
                    <option value="PUBLISHED">Publié</option>
                    <option value="ARCHIVED">Archivé</option>
                  </select>
                </div>
                <div>
                  <Label>URL de l'image</Label>
                  <Input
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div>
                  <Label>Date de programmation</Label>
                  <Input
                    type="date"
                    value={formData.scheduledFor}
                    onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Contenu *</Label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Contenu de la campagne..."
                    className="w-full px-3 py-2 border rounded-md min-h-[150px]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={isEditMode ? handleUpdateCampaign : handleCreateCampaign}>
                  {isEditMode ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Campagnes</p>
                  <p className="text-2xl font-bold">{campaigns.length}</p>
                </div>
                <Share2 className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Publiées</p>
                  <p className="text-2xl font-bold">{campaigns.filter(c => c.status === 'PUBLISHED').length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Programmées</p>
                  <p className="text-2xl font-bold">{campaigns.filter(c => c.status === 'SCHEDULED').length}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Brouillons</p>
                  <p className="text-2xl font-bold">{campaigns.filter(c => c.status === 'DRAFT').length}</p>
                </div>
                <FileText className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Rechercher par nom, contenu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="DRAFT">Brouillon</option>
                <option value="SCHEDULED">Programmé</option>
                <option value="PUBLISHED">Publié</option>
                <option value="ARCHIVED">Archivé</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="ALL">Tous les types</option>
                <option value="social_media">Réseaux sociaux</option>
                <option value="email">Email</option>
                <option value="blog">Blog</option>
                <option value="linkedin">LinkedIn</option>
              </select>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="ALL">Toutes les plateformes</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="email">Email</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              Aucune campagne trouvée
            </div>
          ) : (
            filteredCampaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getPlatformIcon(campaign.platform)}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </div>
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {getTypeIcon(campaign.type)}
                      <span className="capitalize">{campaign.type.replace('_', ' ')}</span>
                      {campaign.platform && (
                        <>
                          <span>·</span>
                          <span className="capitalize">{campaign.platform}</span>
                        </>
                      )}
                    </div>
                    
                    {campaign.imageUrl && (
                      <div className="relative h-40 rounded-lg overflow-hidden bg-gray-100">
                        <img 
                          src={campaign.imageUrl} 
                          alt={campaign.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {campaign.content}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>Créé le {new Date(campaign.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    
                    {campaign.scheduledFor && (
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <Clock className="w-3 h-3" />
                        <span>Programmé pour {new Date(campaign.scheduledFor).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                    
                    {campaign.publishedAt && (
                      <div className="flex items-center gap-2 text-xs text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        <span>Publié le {new Date(campaign.publishedAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      Par {campaign.creator?.firstName} {campaign.creator?.lastName}
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditCampaign(campaign)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                      {campaign.status === 'DRAFT' && (
                        <Button
                          size="sm"
                          onClick={() => handlePublishCampaign(campaign)}
                          className="flex-1"
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Publier
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
