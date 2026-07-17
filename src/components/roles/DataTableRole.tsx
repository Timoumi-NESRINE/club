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
  Shield,
  Users,
  ArrowUpDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Calendar,
  Key
} from 'lucide-react';
import { Role } from '@/types';
import { useToast } from '@/components/ui/toast-compat';
import { useTranslation } from '@/lib/hooks/useTranslation';
import CustomIcon from '@/components/ui/CustomIcon';
import { useColors } from '@/contexts/ColorContext';

interface DataTableRoleProps {
  roles: Role[];
  onEdit: (role: Role) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const ITEMS_PER_PAGE = 10;

export function DataTableRole({
  roles,
  onEdit,
  onDelete,
  isLoading = false
}: DataTableRoleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { t } = useTranslation();
  const { addToast } = useToast();
  const { currentTheme } = useColors();

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const sortedRoles = [...filteredRoles]
    .sort((a, b) => {
      if (!sortColumn) return 0;
      const dir = sortDirection === 'desc' ? -1 : 1;
      if (sortColumn === 'name') return a.name.localeCompare(b.name) * dir;
      if (sortColumn === 'permissions') {
        const permA = a.rolePermissions?.length || 0;
        const permB = b.rolePermissions?.length || 0;
        return (permA - permB) * dir;
      }
      if (sortColumn === 'users') {
        const usersA = a._count?.userRoles || 0;
        const usersB = b._count?.userRoles || 0;
        return (usersA - usersB) * dir;
      }
      if (sortColumn === 'createdAt') return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
      return 0;
    });

  const totalPages = Math.ceil(sortedRoles.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRoles = sortedRoles.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;
    try {
      await onDelete(roleToDelete.id);
      setRoleToDelete(null);
      addToast({
        type: 'success',
        title: t('roles.deleteSuccess'),
        description: t('roles.deleteSuccessDescription', { name: roleToDelete.name })
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du rôle:', error);
      addToast({
        type: 'error',
        title: t('roles.deleteError'),
        description: t('roles.deleteErrorDescription')
      });
    }
  };

  const handleViewDetails = (role: Role) => {
    setSelectedRole(role);
    setIsDetailDialogOpen(true);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (role: Role) => {
    const isActive = role.isActive;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${isActive
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800'
        }`}>
        {isActive ? t('roles.active') : t('roles.inactive')}
      </span>
    );
  };

  const getRoleInitials = (role: Role) => {
    return role.name.substring(0, 2).toUpperCase();
  };

  return (
    <Card className="bg-white border-gray-200 shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#149fad] rounded-xl shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t('roles.roleList')}</h3>
              <p className="text-sm text-gray-600">{t('roles.manageRolesDescription')}</p>
            </div>
          </div>

          <div className="relative flex items-center w-full lg:w-80">
            <CustomIcon name="Search" className="absolute left-7 h-5 w-5 text-[#149fad] pointer-events-none z-10" iconType="custom" invert={false} />
            <Input
              placeholder={t('roles.searchRoles')}
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
                    <Shield className="h-4 w-4" />
                    {t('roles.name')}
                    <ArrowUpDown className="h-4 w-4 opacity-70" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('permissions')} className="cursor-pointer text-gray-800 font-semibold py-4 px-6 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    {t('roles.permissions')}
                    <ArrowUpDown className="h-4 w-4 opacity-70" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('users')} className="cursor-pointer text-gray-800 font-semibold py-4 px-6 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {t('roles.users')}
                    <ArrowUpDown className="h-4 w-4 opacity-70" />
                  </div>
                </TableHead>
                <TableHead className="text-gray-800 font-semibold py-4 px-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {t('roles.status')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('createdAt')} className="cursor-pointer text-gray-800 font-semibold py-4 px-6 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t('roles.created')}
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
              ) : sortedRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-600">
                    {t('roles.noRolesFound')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRoles.map((role) => (
                  <TableRow key={role.id} className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 border-b border-gray-100/50">
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-10 h-10 bg-[#149fad] rounded-xl flex items-center justify-center text-sm font-semibold text-white shadow-lg">
                            {getRoleInitials(role)}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                            {role.isActive ? (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            ) : (
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                            {role.name}
                          </div>
                          {role.description && (
                            <div className="text-xs text-gray-500">{role.description}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-purple-100 rounded-lg">
                          <Key className="h-3 w-3 text-purple-600" />
                        </div>
                        <span className="text-gray-700 font-medium">
                          {role.rolePermissions?.length || 0} {t('roles.permissionsCount')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <Users className="h-3 w-3 text-blue-600" />
                        </div>
                        <span className="text-gray-700 font-medium">
                          {role._count?.userRoles || 0} {t('roles.usersCount')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${role.isActive
                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200'
                        : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${role.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        {role.isActive ? t('roles.active') : t('roles.inactive')}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="p-1.5 bg-gray-100 rounded-lg">
                          <Calendar className="h-3 w-3 text-gray-500" />
                        </div>
                        <span className="font-medium">
                          {new Date(role.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(role)}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-yellow-100 text-yellow-600 hover:text-yellow-700 transition-all duration-200 hover:scale-110"
                          title={t('common.edit')}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(role)}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-[#149fad]/10 text-[#149fad] hover:text-[#149fad] transition-all duration-200 hover:scale-110"
                          title={t('common.view')}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRoleToDelete(role)}
                          disabled={(role._count?.userRoles || 0) > 0}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={t('common.delete')}
                        >
                          <CustomIcon name="Trash" className="h-5 w-5" iconType={currentTheme.iconType} />
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
          ) : sortedRoles.length === 0 ? (
            <div className="text-center py-8 text-gray-600">{t('roles.noRolesFound')}</div>
          ) : (
            paginatedRoles.map((role) => (
              <div key={role.id} className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#149fad] rounded-xl flex items-center justify-center text-lg font-semibold text-white shadow-lg">
                      {getRoleInitials(role)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{role.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[150px]">{role.description}</div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${role.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {role.isActive ? t('roles.active') : t('roles.inactive')}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Key className="h-4 w-4 text-purple-600" />
                    <span>{role.rolePermissions?.length || 0} {t('roles.permissionsCount')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>{role._count?.userRoles || 0} {t('roles.usersCount')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(role.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(role)}
                    className="h-10 w-10 p-0 rounded-xl hover:bg-yellow-100 text-yellow-600"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(role)}
                    className="h-10 w-10 p-0 rounded-xl hover:bg-[#149fad]/10 text-[#149fad]"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRoleToDelete(role)}
                    disabled={(role._count?.userRoles || 0) > 0}
                    className="h-10 w-10 p-0 rounded-xl hover:bg-red-100 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CustomIcon name="Trash" className="h-6 w-6" iconType={currentTheme.iconType} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#149fad] rounded-lg shadow-sm">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {sortedRoles.length} {t('roles.rolesFound')}
                </p>
                <p className="text-xs text-gray-600">
                  {t('roles.showing')} {startIndex + 1} {t('roles.to')} {Math.min(startIndex + ITEMS_PER_PAGE, sortedRoles.length)}
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
                  {t('common.page')} {currentPage} {t('common.of')} {totalPages}
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

      {/* Dialog de détails */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle>{selectedRole?.name}</DialogTitle>
            <DialogDescription>
              {t('roles.roleDetails')}
            </DialogDescription>
          </DialogHeader>

          {selectedRole && (
            <div className="space-y-6">
              {/* Header résumé */}
              <div className="rounded-xl border bg-white p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{selectedRole.name}</div>
                    <div className="text-xs text-muted-foreground">{new Date(selectedRole.createdAt).toLocaleDateString('fr-FR')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedRole)}
                </div>
              </div>

              {/* Description */}
              {selectedRole.description && (
                <div className="rounded-md border p-3">
                  <h4 className="font-semibold mb-2">{t('roles.description')}</h4>
                  <p className="text-sm text-gray-600">{selectedRole.description}</p>
                </div>
              )}

              {/* Informations de base */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-md border p-3">
                  <h4 className="font-semibold mb-2">{t('roles.permissionsInfo')}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-primary" />
                      <span>{selectedRole.rolePermissions?.length || 0} {t('roles.permissionsAssigned')}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border p-3">
                  <h4 className="font-semibold mb-2">{t('roles.usersInfo')}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span>{selectedRole._count?.userRoles || 0} {t('roles.usersAssigned')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              {selectedRole.rolePermissions && selectedRole.rolePermissions.length > 0 && (
                <div className="rounded-md border p-3">
                  <h4 className="font-semibold mb-2">{t('roles.permissions')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRole.rolePermissions.map((rolePermission) => (
                      <span key={rolePermission.permission.id} className="inline-flex items-center px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium">
                        {rolePermission.permission.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500">
                {t('roles.created')} {formatDate(selectedRole.createdAt)}
                {selectedRole.updatedAt && selectedRole.updatedAt !== selectedRole.createdAt && (
                  <span className="ml-4">
                    {t('roles.updated')} {formatDate(selectedRole.updatedAt)}
                  </span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <Dialog open={!!roleToDelete} onOpenChange={() => setRoleToDelete(null)}>
        <DialogContent className="bg-white text-gray-900 [&>*]:text-gray-900 [&>*]:bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">{t('roles.confirmDelete')}</DialogTitle>
            <DialogDescription className="text-gray-700">
              {t('roles.confirmDeleteDescription', { name: roleToDelete?.name })}
              {(roleToDelete?._count?.userRoles || 0) > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                  {t('roles.cannotDeleteWithUsers', { count: roleToDelete?._count?.userRoles })}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRoleToDelete(null)} className="border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-700 bg-white">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={(roleToDelete?._count?.userRoles || 0) > 0}
              className="bg-red-500 text-white hover:bg-red-600 border-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
