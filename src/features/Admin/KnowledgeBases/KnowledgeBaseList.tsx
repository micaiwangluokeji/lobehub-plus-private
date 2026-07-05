'use client';

import { Button, Modal, Popconfirm, Space, message } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AdminSearch, AdminTable, PageHeader } from '@/features/Admin/common';

import type { AdminKnowledgeBase, CreateKnowledgeBaseParams, UpdateKnowledgeBaseParams } from '@/services/admin/knowledge-bases';
import { adminKnowledgeBaseService } from '@/services/admin/knowledge-bases';

const KnowledgeBaseList = memo(() => {
  const { t } = useTranslation('admin');

  const [data, setData] = useState<AdminKnowledgeBase[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingKB, setEditingKB] = useState<AdminKnowledgeBase | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formEmbeddings, setFormEmbeddings] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(
    async (p: number, ps: number, kw: string) => {
      setLoading(true);
      try {
        const res = await adminKnowledgeBaseService.list({ keyword: kw, page: p, pageSize: ps });
        const body = res as unknown as { data: { total: number; knowledgeBases: AdminKnowledgeBase[] } };
        setData(body.data.knowledgeBases || []);
        setTotal(body.data.total);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchData(page, pageSize, keyword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback(
    (val: string) => {
      setKeyword(val);
      setPage(1);
      fetchData(1, pageSize, val);
    },
    [fetchData, pageSize],
  );

  const handlePageChange = useCallback(
    (p: number, ps: number) => {
      setPage(p);
      setPageSize(ps);
      fetchData(p, ps, keyword);
    },
    [fetchData, keyword],
  );

  const handleCreate = useCallback(() => {
    setEditingKB(null);
    setFormName('');
    setFormDescription('');
    setFormEmbeddings('');
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((kb: AdminKnowledgeBase) => {
    setEditingKB(kb);
    setFormName(kb.name);
    setFormDescription(kb.description || '');
    setFormEmbeddings(kb.embeddings || '');
    setFormOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      if (editingKB) {
        const params: UpdateKnowledgeBaseParams = {
          name: formName,
          description: formDescription || undefined,
          embeddings: formEmbeddings || undefined,
        };
        await adminKnowledgeBaseService.update(editingKB.id, params);
      } else {
        const params: CreateKnowledgeBaseParams = {
          name: formName,
          description: formDescription || undefined,
          embeddings: formEmbeddings || undefined,
        };
        await adminKnowledgeBaseService.create(params);
      }
      message.success(t('actions.save') + ' ' + t('actions.confirm'));
      setFormOpen(false);
      setEditingKB(null);
      fetchData(page, pageSize, keyword);
    } catch {
    } finally {
      setSaving(false);
    }
  }, [editingKB, formName, formDescription, formEmbeddings, fetchData, page, pageSize, keyword, t]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await adminKnowledgeBaseService.remove(id);
        message.success(t('actions.delete') + ' ' + t('actions.confirm'));
        fetchData(page, pageSize, keyword);
      } catch {}
    },
    [fetchData, page, pageSize, keyword, t],
  );

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        actions={
          <Button onClick={handleCreate} type="primary">
            {t('knowledgeBases.create')}
          </Button>
        }
        subtitle=""
        title={t('knowledgeBases.title')}
      />
      <div style={{ marginBottom: 16 }}>
        <AdminSearch onSearch={handleSearch} placeholder={t('knowledgeBases.searchPlaceholder')} />
      </div>
      <AdminTable<AdminKnowledgeBase>
        columns={[
          {
            dataIndex: 'name',
            key: 'name',
            title: t('knowledgeBases.columns.name'),
          },
          {
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (text: string | null) => text || '-',
            title: t('knowledgeBases.columns.description'),
          },
          {
            dataIndex: 'embeddings',
            key: 'embeddings',
            render: (text: string | null) => text || '-',
            title: t('knowledgeBases.columns.embeddings'),
          },
          {
            dataIndex: 'userId',
            key: 'creator',
            render: (text: string) => text || '-',
            title: t('knowledgeBases.columns.creator'),
          },
          {
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (val: string) => new Date(val).toLocaleString(),
            title: t('knowledgeBases.columns.createdAt'),
          },
          {
            key: 'actions',
            render: (_: unknown, record: AdminKnowledgeBase) => (
              <Space>
                <Button onClick={() => handleEdit(record)} size="small" type="link">
                  {t('actions.edit')}
                </Button>
                <Popconfirm
                  description={t('knowledgeBases.deleteConfirm')}
                  onConfirm={() => handleDelete(record.id)}
                  title={t('actions.delete')}
                >
                  <Button danger size="small" type="link">
                    {t('actions.delete')}
                  </Button>
                </Popconfirm>
              </Space>
            ),
            title: t('knowledgeBases.columns.actions'),
            width: 160,
          },
        ]}
        dataSource={data}
        loading={loading}
        onPageChange={handlePageChange}
        page={page}
        pageSize={pageSize}
        total={total}
      />
      <Modal
        confirmLoading={saving}
        onCancel={() => {
          setFormOpen(false);
          setEditingKB(null);
        }}
        onOk={handleSave}
        open={formOpen}
        title={editingKB ? t('knowledgeBases.edit') : t('knowledgeBases.create')}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--ant-color-text-secondary)' }}>{t('knowledgeBases.form.name')}</div>
          <input
            onChange={(e) => setFormName(e.target.value)}
            style={{ width: '100%', padding: '6px 12px', border: '1px solid var(--ant-color-border)', borderRadius: 6 }}
            value={formName}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--ant-color-text-secondary)' }}>{t('knowledgeBases.form.description')}</div>
          <textarea
            onChange={(e) => setFormDescription(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '6px 12px', border: '1px solid var(--ant-color-border)', borderRadius: 6, resize: 'vertical' }}
            value={formDescription}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--ant-color-text-secondary)' }}>{t('knowledgeBases.form.embeddings')}</div>
          <input
            onChange={(e) => setFormEmbeddings(e.target.value)}
            style={{ width: '100%', padding: '6px 12px', border: '1px solid var(--ant-color-border)', borderRadius: 6 }}
            value={formEmbeddings}
          />
        </div>
      </Modal>
    </div>
  );
});

KnowledgeBaseList.displayName = 'KnowledgeBaseList';

export default KnowledgeBaseList;
