import { FormControl, FormLabel } from '@chakra-ui/react';
import { Select } from '@components';
import { useStore } from '@store';

export const CustomFormatSelect = ({ onChange }: { onChange: (id: string) => void }) => {
  const customFormats = useStore((store) => store.settings.user?.customFormats ?? []);

  // custom formats to options
  const customFormatOptions = customFormats
    .map((f) => ({
      id: f.id,
      label: f.name,
      value: f.id,
      code: f.code,
    }))
    .sort((a, b) => (a.label < b.label ? -1 : 1));

  const defaultCustomFormat = customFormatOptions.find((f) => f.id === customFormats[0].id);

  const handleSelectFormat = (option: typeof customFormatOptions[0]) => {
    onChange(option.id);
  };

  return (
    <>
      <FormControl>
        <FormLabel>Select Custom Format</FormLabel>
        <Select
          label="Select Custom Formats"
          id="setting-custom-format-select"
          options={customFormatOptions}
          stylesTheme="default"
          value={defaultCustomFormat}
          onChange={handleSelectFormat}
        />
      </FormControl>
    </>
  );
};
