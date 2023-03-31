import { CustomFormat, ExportApiFormatKey, IDocsEntity, useGetExportCitation } from '@api';
import { Flex } from '@chakra-ui/react';
import { SampleTextArea } from '@components';
import { DEFAULT_USER_DATA } from '@components/Settings/model';
import { UserDataSetterEvent } from '@pages/user/settings/export';
import { useStore } from '@store';
import { Dispatch, useEffect, useMemo, useState } from 'react';
import { CustomFormatsTable } from '../CustomFormatsTable';

export type ICustomFormatsTabPanelProps = {
  sampleBib: IDocsEntity['bibcode'];
  dispatch: Dispatch<UserDataSetterEvent>;
};

export const CustomFormatsTabPanel = ({ sampleBib, dispatch }: ICustomFormatsTabPanelProps) => {
  const customFormats = useStore((state) => state.settings.user?.customFormats ?? DEFAULT_USER_DATA.customFormats);
  const [selectedFormat, setSelectedFormat] = useState<CustomFormat>(null);

  // custom formats handlers
  const handleEditCustomFormat = (id: string, name: string, code: string) => {
    dispatch({
      type: 'EDIT_CUSTOM_FORMAT',
      payload: { currentFormats: customFormats, id, name, code },
    });
  };

  // delete cutom format
  const handleDeleteCustomFormat = (id: string) => {
    dispatch({
      type: 'DELETE_CUSTOM_FORMAT',
      payload: { currentFormats: customFormats, id },
    });
  };

  // add custom format
  const handleAddCustomFormat = (name: string, code: string) => {
    dispatch({
      type: 'ADD_CUSTOM_FORMAT',
      payload: { currentFormats: customFormats, name, code },
    });
  };

  // sort custom format, from Id over to
  const handleShiftCustomFormat = (fromId: string, toId: string) => {
    const cf = JSON.parse(JSON.stringify(customFormats)) as CustomFormat[];
    const fromPos = cf.findIndex((f) => f.id === fromId);
    const fromFormat = cf[fromPos];
    const toPos = cf.findIndex((f) => f.id === toId);
    cf.splice(fromPos, 1);
    cf.splice(toPos, 0, fromFormat);

    dispatch({
      type: 'SORT_CUSTOM_FORMAT',
      payload: cf,
    });
  };

  // fetch sample export citation
  const { data: sampleCitation, isLoading } = useGetExportCitation(
    {
      format: ExportApiFormatKey.custom,
      customFormat: selectedFormat?.code ?? '',
      bibcode: [sampleBib],
    },
    { enabled: !!sampleBib && selectedFormat !== null, cacheTime: 0 },
  );

  useEffect(() => {
    setSelectedFormat((prevFormat) => {
      if (!customFormats || customFormats.length === 0) {
        return null;
      }
      // if previously no format selected, or prev format has been deleted
      // set to the first one
      if (!prevFormat || (prevFormat && customFormats.find((f) => f.id === prevFormat.id) === undefined)) {
        return customFormats[0];
      }
      // update in case format has been changed
      return customFormats.find((f) => f.id === prevFormat.id);
    });
  }, [customFormats]);

  // sample export citation text
  const sampleText = useMemo(() => {
    if (isLoading) {
      return '';
    }
    if (!selectedFormat || !sampleCitation) {
      return 'Add a new custom format to see a sample citation';
    }
    return sampleCitation.export;
  }, [sampleCitation, selectedFormat]);

  const handleOnSelect = (id: string) => {
    setSelectedFormat(customFormats.find((f) => f.id === id));
  };

  return (
    <Flex direction={{ base: 'column', lg: 'row' }} justifyContent="space-evenly" gap={{ base: 5, lg: 0 }}>
      <CustomFormatsTable
        customFormats={customFormats}
        onAdd={handleAddCustomFormat}
        onModify={handleEditCustomFormat}
        onDelete={handleDeleteCustomFormat}
        onShiftPosition={handleShiftCustomFormat}
        selected={selectedFormat?.id ?? null}
        onSelect={handleOnSelect}
      />
      <SampleTextArea
        value={sampleText}
        label="Sample Citation"
        p={{ base: 0, lg: 5 }}
        backgroundColor={{ base: 'transparent', lg: 'blue.50' }}
        borderRadius="md"
      />
    </Flex>
  );
};