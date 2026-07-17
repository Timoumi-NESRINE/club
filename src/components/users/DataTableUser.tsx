'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
// Badge component - using inline styling instead
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
  Shield,
  Calendar,
  Ban,
  CheckCircle
} from 'lucide-react';
import { User } from '@/types';
import { useToast } from '@/components/ui/toast-compat';
// Tooltip components - using title attribute instead
import { useTranslation } from '@/lib/hooks/useTranslation';
import CustomIcon from '@/components/ui/CustomIcon';
import { useColors } from '@/contexts/ColorContext';

interface DataTableUserProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onToggleActive?: (user: User) => Promise<void>;
  isLoading?: boolean;
}

const ITEMS_PER_PAGE = 10;

export function DataTableUser({
  users,
  onEdit,
  onDelete,
  onToggleActive,
  isLoading = false
}: DataTableUserProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToToggle, setUserToToggle] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  const filteredUsers = users.filter(user =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.userRoles?.[0]?.role?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
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

  const sortedUsers = [...filteredUsers]
    .sort((a, b) => {
      if (!sortColumn) return 0;
      const dir = sortDirection === 'desc' ? -1 : 1;
      if (sortColumn === 'name') {
        const nameA = `${a.firstName} ${a.lastName}`;
        const nameB = `${b.firstName} ${b.lastName}`;
        return nameA.localeCompare(nameB) * dir;
      }
      if (sortColumn === 'email') return a.email.localeCompare(b.email) * dir;
      if (sortColumn === 'role') {
        const roleA = a.userRoles?.[0]?.role?.name || '';
        const roleB = b.userRoles?.[0]?.role?.name || '';
        return roleA.localeCompare(roleB) * dir;
      }
      if (sortColumn === 'createdAt') return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
      return 0;
    });

  const totalPages = Math.ceil(sortedUsers.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = sortedUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      await onDelete(userToDelete.id);
      setUserToDelete(null);
      addToast({
        type: 'success',
        title: t('users.deleteSuccess'),
        description: t('users.deleteSuccessDescription', { name: `${userToDelete.firstName} ${userToDelete.lastName}` })
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      addToast({
        type: 'error',
        title: t('users.deleteError'),
        description: t('users.deleteErrorDescription')
      });
    }
  };

  const handleToggleConfirm = async () => {
    if (!userToToggle || !onToggleActive) return;
    try {
      await onToggleActive(userToToggle);
      setUserToToggle(null);
      addToast({
        type: 'success',
        title: userToToggle.isActive ? t('users.deactivateSuccess') : t('users.activateSuccess'),
        description: userToToggle.isActive
          ? t('users.deactivateSuccessDescription', { name: `${userToToggle.firstName} ${userToToggle.lastName}` })
          : t('users.activateSuccessDescription', { name: `${userToToggle.firstName} ${userToToggle.lastName}` })
      });
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      addToast({
        type: 'error',
        title: t('users.toggleError'),
        description: t('users.toggleErrorDescription')
      });
    }
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setIsDetailDialogOpen(true);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (user: User) => {
    const isActive = user.isActive;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${isActive
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800'
        }`}>
        {isActive ? t('users.active') : t('users.inactive')}
      </span>
    );
  };

  const getUserInitials = (user: User) => {
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`;
  };

  return (
    <Card className="bg-white border-gray-200 shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#149fad] rounded-xl shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t('users.userList')}</h3>
              <p className="text-sm text-gray-600">{t('users.manageUsersDescription')}</p>
            </div>
          </div>

          <div className="relative flex items-center w-full lg:w-80">
            <CustomIcon name="Search" className="absolute left-7 h-5 w-5 text-[#149fad] pointer-events-none z-10" iconType="custom" invert={false} />
            <Input
              placeholder={t('users.searchUsers')}
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
                    {t('users.nameAndFirstname')}
                    <ArrowUpDown className="h-4 w-4 opacity-70" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('email')} className="cursor-pointer text-gray-800 font-semibold py-4 px-6 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <CustomIcon name="Mail" className="h-4 w-4" iconType="custom" invert={false} />
                    {t('users.email')}
                    <ArrowUpDown className="h-4 w-4 opacity-70" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('role')} className="cursor-pointer text-gray-800 font-semibold py-4 px-6 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {t('users.role')}
                    <ArrowUpDown className="h-4 w-4 opacity-70" />
                  </div>
                </TableHead>
                <TableHead className="text-gray-800 font-semibold py-4 px-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {t('users.status')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('createdAt')} className="cursor-pointer text-gray-800 font-semibold py-4 px-6 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t('users.createdAt')}
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
              ) : sortedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-600">
                    {t('users.noUsersFound')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow key={user.id} className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 border-b border-gray-100/50">
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-10 h-10 bg-[#149fad] rounded-xl flex items-center justify-center text-sm font-semibold text-white shadow-lg">
                            {getUserInitials(user)}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                            {user.isActive ? (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            ) : (
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <CustomIcon name="Mail" className="h-4 w-4" iconType="custom" invert={false} />
                        </div>
                        <a href={`mailto:${user.email}`} className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                          {user.email}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-purple-100 rounded-lg">
                          <Shield className="h-3 w-3 text-purple-600" />
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                          {user.userRoles?.[0]?.role?.name || t('users.noRole')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${user.isActive
                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200'
                        : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        {user.isActive ? t('users.active') : t('users.inactive')}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="p-1.5 bg-gray-100 rounded-lg">
                          <Calendar className="h-3 w-3 text-gray-500" />
                        </div>
                        <span className="font-medium">
                          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(user)}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-yellow-100 text-yellow-600 hover:text-yellow-700 transition-all duration-200 hover:scale-110"
                          title={t('common.edit')}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(user)}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-[#149fad]/10 text-[#149fad] hover:text-[#149fad] transition-all duration-200 hover:scale-110"
                          title={t('common.view')}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUserToDelete(user)}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-110"
                          title={t('common.delete')}
                        >
                          <CustomIcon name="Trash" className="h-5 w-5" iconType={currentTheme.iconType} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUserToToggle(user)}
                          className={`h-8 w-8 p-0 rounded-lg transition-all duration-200 hover:scale-110 ${
                            user.isActive
                              ? 'hover:bg-red-100 text-red-600 hover:text-red-700'
                              : 'hover:bg-green-100 text-green-600 hover:text-green-700'
                          }`}
                          title={user.isActive ? t('users.deactivate') : t('users.activate')}
                        >
                          {user.isActive ? (
                            <Ban className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
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
          ) : sortedUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-600">{t('users.noUsersFound')}</div>
          ) : (
            paginatedUsers.map((user) => (
              <div key={user.id} className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#149fad] rounded-xl flex items-center justify-center text-lg font-semibold text-white shadow-lg">
                      {getUserInitials(user)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-gray-500">@{user.username}</div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.isActive ? t('users.active') : t('users.inactive')}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <CustomIcon name="Mail" className="h-4 w-4" iconType="custom" invert={false} />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Shield className="h-4 w-4 text-purple-600" />
                    <span>{user.userRoles?.[0]?.role?.name || t('users.noRole')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(user)}
                    className="h-10 w-10 p-0 rounded-xl hover:bg-yellow-100 text-yellow-600"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(user)}
                    className="h-10 w-10 p-0 rounded-xl hover:bg-[#149fad]/10 text-[#149fad]"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUserToDelete(user)}
                    className="h-10 w-10 p-0 rounded-xl hover:bg-red-100 text-red-600"
                  >
                    <CustomIcon name="Trash" className="h-6 w-6" iconType={currentTheme.iconType} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUserToToggle(user)}
                    className={`h-10 w-10 p-0 rounded-xl ${
                      user.isActive
                        ? 'hover:bg-red-100 text-red-600'
                        : 'hover:bg-green-100 text-green-600'
                    }`}
                  >
                    {user.isActive ? (
                      <Ban className="h-5 w-5" />
                    ) : (
                      <CheckCircle className="h-5 w-5" />
                    )}
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
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {sortedUsers.length} {t('users.usersFound')}
                </p>
                <p className="text-xs text-gray-600">
                  {t('users.showing')} {startIndex + 1} {t('users.to')} {Math.min(startIndex + ITEMS_PER_PAGE, sortedUsers.length)}
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
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto bg-white  text-gray-900 ">
          <DialogHeader>
            <DialogTitle>{selectedUser?.firstName} {selectedUser?.lastName}</DialogTitle>
            <DialogDescription>
              {t('users.userDetails')}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* Header résumé */}
              <div className="rounded-xl border bg-white p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{selectedUser.firstName} {selectedUser.lastName}</div>
                    <div className="text-xs text-muted-foreground">{new Date(selectedUser.createdAt).toLocaleDateString('fr-FR')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded border border-primary/20 bg-primary/5 text-primary text-xs font-medium">
                    {selectedUser.userRoles?.[0]?.role?.name || t('users.noRole')}
                  </span>
                  {getStatusBadge(selectedUser)}
                </div>
              </div>

              {/* Informations de base */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-md border p-3">
                  <h4 className="font-semibold mb-2">{t('users.contactInfo')}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <a href={`mailto:${selectedUser.email}`} className="text-primary hover:underline">
                        {selectedUser.email}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border p-3">
                  <h4 className="font-semibold mb-2">{t('users.roleInfo')}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span>{selectedUser.userRoles?.[0]?.role?.name || t('users.noRole')}</span>
                    </div>
                    {selectedUser.userRoles?.[0]?.role?.description && (
                      <p className="text-muted-foreground text-xs">
                        {selectedUser.userRoles[0].role.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Permissions */}
              {selectedUser.userRoles?.[0]?.role?.rolePermissions && selectedUser.userRoles[0].role.rolePermissions.length > 0 && (
                <div className="rounded-md border p-3">
                  <h4 className="font-semibold mb-2">{t('users.permissions')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.userRoles[0].role.rolePermissions.map((rolePermission) => (
                      <span key={rolePermission.permission.id} className="inline-flex items-center px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium">
                        {rolePermission.permission.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500">
                {t('users.createdAt')} {formatDate(selectedUser.createdAt)}
                {selectedUser.updatedAt && selectedUser.updatedAt !== selectedUser.createdAt && (
                  <span className="ml-4">
                    {t('users.updatedAt')} {formatDate(selectedUser.updatedAt)}
                  </span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <DialogContent className="bg-white text-gray-900 [&>*]:text-gray-900 [&>*]:bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">{t('users.confirmDelete')}</DialogTitle>
            <DialogDescription className="text-gray-700">
              {t('users.confirmDeleteDescription', { name: `${userToDelete?.firstName} ${userToDelete?.lastName}` })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setUserToDelete(null)} className="border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-700 bg-white">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleDeleteConfirm} className="bg-red-500 text-white hover:bg-red-600 border-0">
              {t('common.delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation Activer/Désactiver */}
      <Dialog open={!!userToToggle} onOpenChange={() => setUserToToggle(null)}>
        <DialogContent className="bg-white text-gray-900 [&>*]:text-gray-900 [&>*]:bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {userToToggle?.isActive ? t('users.confirmDeactivate') : t('users.confirmActivate')}
            </DialogTitle>
            <DialogDescription className="text-gray-700">
              {userToToggle?.isActive
                ? t('users.confirmDeactivateDescription', { name: `${userToToggle?.firstName} ${userToToggle?.lastName}` })
                : t('users.confirmActivateDescription', { name: `${userToToggle?.firstName} ${userToToggle?.lastName}` })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setUserToToggle(null)} className="border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-700 bg-white">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleToggleConfirm}
              className={userToToggle?.isActive ? 'bg-red-500 text-white hover:bg-red-600 border-0' : 'bg-green-500 text-white hover:bg-green-600 border-0'}
            >
              {userToToggle?.isActive ? t('users.deactivate') : t('users.activate')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
