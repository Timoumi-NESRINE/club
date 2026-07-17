'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  PencilIcon,
  EyeIcon,
  Mail,
  User as UserIcon,
  ArrowUpDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Globe
} from 'lucide-react';
import { Client } from '@/types';
import { useToast } from '@/components/ui/toast-compat';
import CustomIcon from '@/components/ui/CustomIcon';
import { useColors } from '@/contexts/ColorContext';
import { useTranslation } from '@/lib/hooks/useTranslation';

interface DataTableClientProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const ITEMS_PER_PAGE = 10;

export function DataTableClient({
  clients,
  onEdit,
  onDelete,
  isLoading = false
}: DataTableClientProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  const { addToast } = useToast();
  const { currentTheme } = useColors();

  const filteredClients = clients.filter(c =>
    `${c.prenom} ${c.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.region || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.pays || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const sortedClients = [...filteredClients].sort((a, b) => {
    if (!sortColumn) return 0;
    const dir = sortDirection === 'desc' ? -1 : 1;

    if (sortColumn === 'name') {
      const nameA = `${a.prenom} ${a.nom}`;
      const nameB = `${b.prenom} ${b.nom}`;
      return nameA.localeCompare(nameB) * dir;
    }
    if (sortColumn === 'mail') return a.mail.localeCompare(b.mail) * dir;
    if (sortColumn === 'dateAdhesion') {
      return (new Date(a.dateAdhesion).getTime() - new Date(b.dateAdhesion).getTime()) * dir;
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedClients.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedClients = sortedClients.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    try {
      await onDelete(clientToDelete.id);
      addToast({
        type: 'success',
        title: t('clients.deleteSuccess'),
        description: `${clientToDelete.prenom} ${clientToDelete.nom}`
      });
      setClientToDelete(null);
    } catch (error) {
      console.error('Erreur lors de la suppression du client:', error);
      addToast({
        type: 'error',
        title: t('common.error'),
        description: t('messages.operationFailed')
      });
      setClientToDelete(null);
    }
  };

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setIsDetailDialogOpen(true);
  };

  return (
    <Card className="bg-white border-gray-200 shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#149fad] rounded-xl shadow-lg">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t('clients.clientList')}</h3>
              <p className="text-sm text-gray-600">{t('clients.manageClients')}</p>
            </div>
          </div>

          <div className="relative flex items-center w-full lg:w-80">
            <CustomIcon name="Search" className="absolute left-7 h-5 w-5 text-[#149fad] pointer-events-none z-10" iconType="custom" invert={false} />
            <Input
              placeholder={t('clients.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-14 pr-4 py-2 w-full bg-white border-gray-300 rounded-xl shadow-md focus:ring-2 focus:ring-[#149fad]/20 focus:border-[#149fad] transition-all duration-200 text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Desktop View */}
        <div className="hidden lg:block overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50 sticky top-0 z-10">
              <TableRow className="border-b border-gray-200 hover:bg-transparent">
                <TableHead onClick={() => handleSort('name')} className="cursor-pointer text-gray-800 font-semibold py-4 px-6 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    {t('clients.nameAndFirstname')}
                    <ArrowUpDown className="h-4 w-4 opacity-70" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('mail')} className="cursor-pointer text-gray-800 font-semibold py-4 px-6 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <CustomIcon name="Mail" className="h-4 w-4" iconType="custom" invert={false} />
                    {t('clients.email')}
                    <ArrowUpDown className="h-4 w-4 opacity-70" />
                  </div>
                </TableHead>
                <TableHead className="text-gray-800 font-semibold py-4 px-6">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {t('clients.phone')}
                  </div>
                </TableHead>
                <TableHead className="text-gray-800 font-semibold py-4 px-6">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {t('clients.regionCountry')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('dateAdhesion')} className="cursor-pointer text-gray-800 font-semibold py-4 px-6 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t('clients.membership')}
                    <ArrowUpDown className="h-4 w-4 opacity-70" />
                  </div>
                </TableHead>
                <TableHead className="text-center text-gray-800 font-semibold py-4 px-6">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-600">
                    {t('common.loading')}
                  </TableCell>
                </TableRow>
              ) : sortedClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-600">
                    {t('clients.noClients')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedClients.map((c) => (
                  <TableRow key={c.id} className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 border-b border-gray-100/50">
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#149fad] rounded-xl flex items-center justify-center text-sm font-semibold text-white shadow-lg">
                          {(c.prenom?.charAt(0) || '')}{(c.nom?.charAt(0) || '')}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                            {c.prenom} {c.nom}
                          </div>
                          <div className="text-xs text-gray-500">{c.codeAgence ? `${t('clients.agencyCode')}: ${c.codeAgence}` : ''}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <CustomIcon name="Mail" className="h-4 w-4" iconType="custom" invert={false} />
                        </div>
                        <a href={`mailto:${c.mail}`} className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                          {c.mail}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="text-sm text-gray-700 font-medium">
                        {c.phone || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="text-sm text-gray-700 font-medium">
                        {(c.region || '-')}{c.pays ? `, ${c.pays}` : ''}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="p-1.5 bg-gray-100 rounded-lg">
                          <Calendar className="h-3 w-3 text-gray-500" />
                        </div>
                        <span className="font-medium">
                          {c.dateAdhesion ? new Date(c.dateAdhesion).toLocaleDateString(t('common.page') === 'page' ? 'en-US' : 'fr-FR') : '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(c)}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-yellow-100 text-yellow-600 hover:text-yellow-700 transition-all duration-200 hover:scale-110"
                          title={t('common.edit')}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(c)}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-[#149fad]/10 text-[#149fad] hover:text-[#149fad] transition-all duration-200 hover:scale-110"
                          title={t('common.details')}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setClientToDelete(c)}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-110"
                          title={t('common.delete')}
                        >
                          <CustomIcon name="Trash" className="h-5 h-5" iconType={currentTheme.iconType} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View - Cards */}
        <div className="lg:hidden p-4 space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-600">{t('common.loading')}</div>
          ) : sortedClients.length === 0 ? (
            <div className="text-center py-8 text-gray-600">{t('clients.noClients')}</div>
          ) : (
            paginatedClients.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#149fad] rounded-xl flex items-center justify-center text-lg font-semibold text-white shadow-lg">
                    {(c.prenom?.charAt(0) || '')}{(c.nom?.charAt(0) || '')}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">
                      {c.prenom} {c.nom}
                    </div>
                    <div className="text-xs text-gray-500">{c.codeAgence ? `${t('clients.agencyCode')}: ${c.codeAgence}` : ''}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <CustomIcon name="Mail" className="h-4 w-4" iconType="custom" invert={false} />
                    <span className="truncate">{c.mail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4 text-blue-500" />
                    <span>{c.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 text-red-500" />
                    <span>{(c.region || '-')}{c.pays ? `, ${c.pays}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>{c.dateAdhesion ? new Date(c.dateAdhesion).toLocaleDateString(t('common.page') === 'page' ? 'en-US' : 'fr-FR') : '-'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(c)}
                    className="h-10 w-10 p-0 rounded-xl hover:bg-yellow-100 text-yellow-600"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(c)}
                    className="h-10 w-10 p-0 rounded-xl hover:bg-[#149fad]/10 text-[#149fad]"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setClientToDelete(c)}
                    className="h-10 w-10 p-0 rounded-xl hover:bg-red-100 text-red-600"
                  >
                    <CustomIcon name="Trash" className="h-6 w-6" iconType={currentTheme.iconType} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#149fad] rounded-lg shadow-sm">
                <UserIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {sortedClients.length} {t('clients.stats.found')}
                </p>
                <p className="text-xs text-gray-600">
                  {t('clients.stats.showing', { start: startIndex + 1, end: Math.min(startIndex + ITEMS_PER_PAGE, sortedClients.length) })}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-end gap-2 overflow-x-auto pb-2 sm:pb-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 shadow-sm flex-shrink-0"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 shadow-sm flex-shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2 px-4 py-2 bg-[#149fad]/10 rounded-lg border border-[#149fad]/20 shadow-sm whitespace-nowrap">
                <span className="text-sm font-bold text-[#149fad]">
                  {t('common.pageLabel')} {currentPage} / {totalPages}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 shadow-sm flex-shrink-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 shadow-sm flex-shrink-0"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto bg-white  text-gray-900 ">
          <DialogHeader>
            <DialogTitle>{selectedClient?.prenom} {selectedClient?.nom}</DialogTitle>
            <DialogDescription>
              {t('clients.details')}
            </DialogDescription>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-6">
              <div className="rounded-xl border bg-white p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#149fad] rounded-2xl flex items-center justify-center text-base font-semibold text-white shadow-lg">
                    {(selectedClient.prenom?.charAt(0) || '')}{(selectedClient.nom?.charAt(0) || '')}
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{selectedClient.prenom} {selectedClient.nom}</div>
                    <div className="text-xs text-gray-500">
                      {selectedClient.dateAdhesion ? new Date(selectedClient.dateAdhesion).toLocaleDateString(t('common.page') === 'page' ? 'en-US' : 'fr-FR') : '-'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {selectedClient.codeAgence && (
                    <span className="inline-flex items-center px-2 py-1 rounded border border-[#149fad]/20 bg-[#149fad]/5 text-[#149fad] text-xs font-medium">
                      <Building2 className="h-3 w-3 mr-1" />
                      {selectedClient.codeAgence}
                    </span>
                  )}
                  {selectedClient.pays && (
                    <span className="inline-flex items-center px-2 py-1 rounded border border-blue-200 bg-blue-50 text-blue-700 text-xs font-medium">
                      <Globe className="h-3 w-3 mr-1" />
                      {selectedClient.pays}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h4 className="font-semibold mb-3">{t('clients.contact')}</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <Mail className="h-3 w-3 text-blue-600" />
                      </div>
                      <a href={`mailto:${selectedClient.mail}`} className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                        {selectedClient.mail}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-green-100 rounded-lg">
                        <Phone className="h-3 w-3 text-green-700" />
                      </div>
                      <span className="text-gray-700 font-medium">{selectedClient.phone || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h4 className="font-semibold mb-3">{t('clients.address')}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="p-1.5 bg-purple-100 rounded-lg mt-0.5">
                        <MapPin className="h-3 w-3 text-purple-700" />
                      </div>
                      <div className="text-gray-700 font-medium">
                        <div>{selectedClient.adresse || '-'}</div>
                        <div className="text-gray-600">
                          {selectedClient.codePostal || '-'} {selectedClient.region || '-'} {selectedClient.pays || '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
        <DialogContent className="bg-white text-gray-900 [&>*]:text-gray-900 [&>*]:bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">{t('clients.confirmDelete')}</DialogTitle>
            <DialogDescription className="text-gray-700">
              {t('clients.confirmDeleteMessage', { name: `${clientToDelete?.prenom} ${clientToDelete?.nom}` })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setClientToDelete(null)} className="border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-700 bg-white">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleDeleteConfirm} className="bg-red-500 text-white hover:bg-red-600 border-0">
              {t('common.delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
