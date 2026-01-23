'use client';

import { ApplicationMetadata } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConfigFormProps {
  metadata: ApplicationMetadata;
  onMetadataChange: (metadata: ApplicationMetadata) => void;
}

export function ConfigForm({ metadata, onMetadataChange }: ConfigFormProps) {
  const handleChange = (updates: Partial<ApplicationMetadata>) => {
    onMetadataChange({ ...metadata, ...updates });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">應用程式設定</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="appId">應用程式 ID *</Label>
            <Input
              id="appId"
              value={metadata.id}
              onChange={(e) => handleChange({ id: e.target.value })}
              placeholder="例如：MYAPP"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keyAttribute">主鍵屬性 *</Label>
            <Input
              id="keyAttribute"
              value={metadata.keyAttribute}
              onChange={(e) => handleChange({ keyAttribute: e.target.value })}
              placeholder="例如：TICKETID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mboName">MBO 名稱</Label>
            <Input
              id="mboName"
              value={metadata.mboName}
              onChange={(e) => handleChange({ mboName: e.target.value })}
              placeholder="例如：SR"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="version">版本</Label>
            <Input
              id="version"
              value={metadata.version}
              onChange={(e) => handleChange({ version: e.target.value })}
              placeholder="例如：7.6.1.2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orderBy">排序方式</Label>
            <Input
              id="orderBy"
              value={metadata.orderBy}
              onChange={(e) => handleChange({ orderBy: e.target.value })}
              placeholder="例如：TICKETID DESC"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whereClause">條件子句</Label>
            <Input
              id="whereClause"
              value={metadata.whereClause}
              onChange={(e) => handleChange({ whereClause: e.target.value })}
              placeholder="例如：STATUS != 'CLOSED'"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="beanclass">Bean Class</Label>
            <Input
              id="beanclass"
              value={metadata.beanclass}
              onChange={(e) => handleChange({ beanclass: e.target.value })}
              placeholder="例如：psdi.webclient.beans.MyAppBean"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          <Checkbox
            id="isStandardObject"
            checked={metadata.isStandardObject}
            onCheckedChange={(checked) =>
              handleChange({ isStandardObject: checked === true })
            }
          />
          <Label htmlFor="isStandardObject" className="text-sm font-normal">
            原廠物件（如 SR、WORKORDER、ASSET 等）- 自動產生的欄位名稱會加上 ZZ 前綴
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}
