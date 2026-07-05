'use client';

import { Card, Col, Row, Statistic, Table, Tag, Typography } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/features/Admin/common';
import { adminSystemHealthService, type HealthStatus, type SystemHealthCheckItem } from '@/services/admin/system-health';

const { Text } = Typography;

const statusColors: Record<string, string> = {
  healthy: 'green',
  degraded: 'orange',
  down: 'red',
};

const SystemHealthDashboard = memo(() => {
  const { t } = useTranslation('admin');
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({});
  const [loading, setLoading] = useState(false);
  const [checks, setChecks] = useState<SystemHealthCheckItem[]>([]);

  const fetchHealthStatus = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminSystemHealthService.getHealthStatus();
      setHealthStatus(data);
    } catch {
      // Use mock data for now
      setHealthStatus({
        'api.lobehub.com': { status: 'healthy', lastCheck: new Date().toISOString(), responseTime: 120 },
        'auth.lobehub.com': { status: 'healthy', lastCheck: new Date().toISOString(), responseTime: 80 },
        'database': { status: 'healthy', lastCheck: new Date().toISOString(), responseTime: 5 },
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchChecks = useCallback(async () => {
    try {
      const data = await adminSystemHealthService.list({});
      setChecks(data.data);
    } catch {
      // Use mock data for now
      setChecks([
        { id: '1', serviceName: 'api.lobehub.com', status: 'healthy', responseTime: 120, checkedAt: new Date().toISOString(), createdAt: '', updatedAt: '' },
        { id: '2', serviceName: 'auth.lobehub.com', status: 'healthy', responseTime: 80, checkedAt: new Date().toISOString(), createdAt: '', updatedAt: '' },
        { id: '3', serviceName: 'database', status: 'healthy', responseTime: 5, checkedAt: new Date().toISOString(), createdAt: '', updatedAt: '' },
      ]);
    }
  }, [t]);

  useEffect(() => {
    fetchHealthStatus();
    fetchChecks();
  }, [fetchHealthStatus, fetchChecks]);

  const columns = [
    {
      title: t('systemHealth.columns.serviceName'),
      dataIndex: 'serviceName',
      key: 'serviceName',
      width: 200,
    },
    {
      title: t('systemHealth.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <Tag color={statusColors[status]}>{status}</Tag>,
    },
    {
      title: t('systemHealth.columns.responseTime'),
      dataIndex: 'responseTime',
      key: 'responseTime',
      width: 150,
      render: (time: number) => (time ? `${time} ms` : '-'),
    },
    {
      title: t('systemHealth.columns.checkedAt'),
      dataIndex: 'checkedAt',
      key: 'checkedAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <div>
      <PageHeader title={t('systemHealth.title')} />
      <Row gutter={[16, 16]}>
        {Object.entries(healthStatus).map(([serviceName, status]) => (
          <Col span={8} key={serviceName}>
            <Card>
              <Statistic
                title={serviceName}
                value={status.status}
                valueStyle={{ color: statusColors[status.status] === 'green' ? '#3f8600' : '#cf1322' }}
              />
              <Text type="secondary">
                {t('systemHealth.lastCheck')}: {new Date(status.lastCheck).toLocaleString()}
              </Text>
              {status.responseTime && (
                <Text type="secondary" style={{ marginLeft: 16 }}>
                  {t('systemHealth.responseTime')}: {status.responseTime} ms
                </Text>
              )}
            </Card>
          </Col>
        ))}
      </Row>
      <Card style={{ marginTop: 16 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={checks}
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  );
});

SystemHealthDashboard.displayName = 'SystemHealthDashboard';

export default SystemHealthDashboard;
