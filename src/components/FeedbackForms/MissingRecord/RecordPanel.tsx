import {
  Stack,
  FormControl,
  FormLabel,
  Input,
  CheckboxGroup,
  Checkbox,
  HStack,
  Textarea,
  Button,
  Flex,
  FormErrorMessage,
} from '@chakra-ui/react';
import { noop } from '@utils';
import { SingleDatepicker } from 'chakra-dayzed-datepicker';
import { Field, FieldArray, FieldArrayRenderProps, FieldProps, useField } from 'formik';
import { useState } from 'react';
import { KeywordList, ReferencesTable } from '.';
import { AuthorsTable } from './AuthorsTable';
import { Collection, IAuthor, FormValues, IReference, IUrl } from './types';
import { URLTable } from './URLTable';

const collections: { value: Collection; label: string }[] = [
  { value: Collection.astronomy, label: 'Astronomy and Astrophysics' },
  { value: Collection.physics, label: 'Physics and Geophysics' },
  { value: Collection.general, label: 'General' },
];

const datePropConfig = {
  dateNavBtnProps: {
    variant: 'outline',
  },
  dayOfMonthBtnProps: {
    defaultBtnProps: {
      borderColor: 'red.300',
      _hover: {
        background: 'blue.400',
      },
    },
    selectedBtnProps: {
      background: 'blue.200',
      borderColor: 'blue.300',
      color: 'blue.600',
    },
    todayBtnProps: {
      variant: 'outline',
    },
  },
};

export const RecordPanel = ({
  isNew,
  formData,
  onRecordLoaded = noop,
}: {
  isNew: boolean;
  formData?: FormValues;
  onRecordLoaded?: () => void;
}) => {
  const [recordLoaded, setRecordLoaded] = useState(formData ? true : false);

  const [{ value: authors }] = useField<IAuthor[]>({
    name: 'authors',
    validate: (value: IAuthor[]) => {
      if (!value || value.length === 0) {
        return 'Authors are required';
      }
    },
  });

  const [, , { setValue: setPubDateValue }] = useField<Date>('pubDate');

  const [{ value: urls }] = useField<IUrl[]>('urls');

  const [{ value: keywords }] = useField<string[]>({
    name: 'keywords',
  });

  const [{ value: references }] = useField<IReference[]>({
    name: 'references',
  });

  return (
    <Stack direction="column" gap={4} m={0}>
      <Field name="bibcode">
        {({ field }: FieldProps<FormValues['bibcode']>) => (
          <FormControl isRequired>
            <FormLabel>Bibcode</FormLabel>
            <Flex direction="row">
              <Input {...field} />
              {!isNew && (
                <Button
                  size="md"
                  borderStartRadius={0}
                  borderEndRadius={2}
                  isDisabled={!field.value || field.value.length === 0}
                >
                  Load
                </Button>
              )}
            </Flex>
          </FormControl>
        )}
      </Field>

      {(isNew || (!isNew && recordLoaded)) && (
        <>
          <FormControl>
            <FormLabel>Collection</FormLabel>
            <CheckboxGroup>
              <Field name="collection">
                {({ field }: FieldProps) => (
                  <Stack direction="row">
                    {collections.map((c) => (
                      <Checkbox key={`collection-${c.value}`} {...field} value={c.value}>
                        {c.label}
                      </Checkbox>
                    ))}
                  </Stack>
                )}
              </Field>
            </CheckboxGroup>
          </FormControl>

          <Field name="title">
            {({ field }: FieldProps) => (
              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input {...field} />
              </FormControl>
            )}
          </Field>

          <FieldArray name="authors">
            {({ remove, push, form, replace }: FieldArrayRenderProps) => (
              <FormControl isInvalid={!!form.errors.authors && !!form.touched.authors}>
                <FormLabel>Authors</FormLabel>
                <FormErrorMessage>{form.errors.authors}</FormErrorMessage>
                <AuthorsTable
                  authors={authors}
                  onAddAuthor={push}
                  onDeleteAuthor={remove}
                  onUpdateAuthor={replace}
                  editable={true}
                />
              </FormControl>
            )}
          </FieldArray>

          <HStack gap={2}>
            <Field name="publication">
              {({ field }: FieldProps) => (
                <FormControl isRequired>
                  <FormLabel>Publications</FormLabel>
                  <Input {...field} />
                </FormControl>
              )}
            </Field>

            <Field name="pubDate">
              {({ field }: FieldProps<FormValues['pubDate']>) => (
                <FormControl isRequired>
                  <FormLabel>Publication Date</FormLabel>
                  <SingleDatepicker date={field.value} onDateChange={setPubDateValue} propsConfigs={datePropConfig} />
                </FormControl>
              )}
            </Field>
          </HStack>

          <FieldArray name="urls">
            {({ remove, push, replace }: FieldArrayRenderProps) => (
              <FormControl>
                <FormLabel>URLs</FormLabel>
                <URLTable urls={urls} onAddUrl={push} onDeleteUrl={remove} onUpdateUrl={replace} editable />
              </FormControl>
            )}
          </FieldArray>

          <Field name="abstract">
            {({ field }: FieldProps) => (
              <FormControl isRequired>
                <FormLabel>Abstract</FormLabel>
                <Textarea {...field} />
              </FormControl>
            )}
          </Field>

          <FieldArray name="keywords">
            {({ remove, push }: FieldArrayRenderProps) => (
              <FormControl>
                <FormLabel>Keywords</FormLabel>
                <KeywordList keywords={keywords} onAddKeyword={push} onDeleteKeyword={remove} />
              </FormControl>
            )}
          </FieldArray>

          <FieldArray name="references">
            {({ remove, push, replace }: FieldArrayRenderProps) => (
              <FormControl>
                <FormLabel>References</FormLabel>
                <ReferencesTable
                  references={references}
                  onAddReference={push}
                  onDeleteReference={remove}
                  onUpdateReference={replace}
                  editable
                />
              </FormControl>
            )}
          </FieldArray>

          <Field name="comment">
            {({ field }: FieldProps) => (
              <FormControl>
                <FormLabel>User Comments</FormLabel>
                <Textarea {...field} />
              </FormControl>
            )}
          </Field>
        </>
      )}
    </Stack>
  );
};
