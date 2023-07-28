import { Database, useGetSingleRecord } from '@api';
import { IFeedbackParams } from '@api/feedback';
import {
  AlertStatus,
  Button,
  Checkbox,
  CheckboxGroup,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Stack,
  Textarea,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { PreviewModal } from '@components';
import { useGetResourceLinks } from '@lib';
import { useStore } from '@store';
import {
  Field,
  FieldArray,
  FieldArrayRenderProps,
  FieldProps,
  Form,
  Formik,
  FormikHelpers,
  FormikProps,
  useField,
} from 'formik';
import { omit } from 'ramda';
import { useEffect, useRef, useState } from 'react';
import { KeywordList, ReferencesTable } from '.';
import { AuthorsTable } from './AuthorsTable';
import { getDiffSections, getDiffString, processFormValues } from './DiffUtil';
import { IAuthor, FormValues, IUrl, IReference, DiffSection } from './types';
import { URLTable } from './URLTable';

const collections: { value: Database; label: string }[] = [
  { value: 'astronomy', label: 'Astronomy and Astrophysics' },
  { value: 'physics', label: 'Physics and Geophysics' },
  { value: 'general', label: 'General' },
];

// TODO: speed problem
// TODO: validate email on all forms
// TODO: scroll to top after submission
// TODO: scroll to invalid field at onpreview
// TODO: pagination authors and other tables
// TODO: reorder authors
// TODO: validate bibcodes
// TODO: wrap preview in error boundary (diff might throw error)

export const RecordPanel = ({
  isNew,
  onOpenAlert,
  isFocused,
}: {
  isNew: boolean;
  onOpenAlert: (params: { status: AlertStatus; title: string; description?: string }) => void;
  isFocused: boolean;
}) => {
  const toast = useToast({ duration: 4000 });

  const username = useStore((state) => state.user.username);

  const intialFormValues = {
    name: '',
    email: username ?? '',
    bibcode: '',
    collection: [] as Database[],
    title: '',
    noAuthors: false,
    authors: [] as IAuthor[],
    publication: '',
    pubDate: '',
    urls: [] as IUrl[],
    abstract: '',
    keywords: [] as string[],
    references: [] as IReference[],
    comments: '',
  };

  const formikRef = useRef<FormikProps<FormValues>>();

  const { isOpen: isPreviewOpen, onOpen: openPreview, onClose: closePreview } = useDisclosure();

  // preview diff when editing existing record
  const [diffSections, setDiffSections] = useState<DiffSection[]>([]);

  // original form values from existing record
  // used for diff view
  const [recordOriginalFormValues, setRecordOriginalFormValues] = useState<FormValues>(intialFormValues);

  const [loadById, setLoadById] = useState<string>(null);

  const [params, setParams] = useState<IFeedbackParams>(null);

  const nameFieldRef = useRef<HTMLInputElement>();

  // when this tab is focused, set focus on name field
  useEffect(() => {
    if (isFocused) {
      nameFieldRef.current.focus();
    }
  }, [isFocused]);

  // open preview when params set
  useEffect(() => {
    if (params !== null) {
      openPreview();
    }
  }, [params]);

  // fetch record
  const { data, isLoading, isSuccess, error } = useGetSingleRecord(
    { id: loadById },
    {
      enabled: loadById !== null && loadById.length > 0,
    },
  );

  // fetch record's urls
  const {
    data: urlsData,
    isLoading: urlsIsLoading,
    isSuccess: urlsIsSuccess,
    error: urlsIsError,
  } = useGetResourceLinks({
    identifier: loadById,
    options: { enabled: loadById !== null && loadById.length > 0 },
  });

  // fill form values with fetched data
  const loadFormValuesWithRecordData = () => {
    const {
      abstract = '',
      aff,
      author,
      keyword = [],
      orcid_pub,
      pub_raw,
      pubdate,
      title,
      database = [],
      reference = [] as string[],
    } = data.docs[0];
    const authors = author.map((name, index) => {
      return {
        name,
        aff: aff[index] !== '-' ? aff[index] : '',
        orcid: orcid_pub[index] !== '-' ? orcid_pub[index] : '',
      };
    });

    // TODO: BBB doesn't not allow edit references here for existing record, but refers to references form,
    //       which can only add but not delete. Do we keep doing that?
    // TODO: support other types: Type is not implemented internally. Here we are saying type is always bibcode
    const references: IReference[] = reference.map((r) => ({ type: 'Bibcode', reference: r }));

    setRecordOriginalFormValues({
      name: formikRef.current.values.name,
      email: formikRef.current.values.email,
      bibcode: loadById,
      abstract,
      title: title[0],
      publication: pub_raw,
      pubDate: pubdate,
      noAuthors: !author || authors.length === 0,
      authors,
      keywords: keyword,
      collection: database,
      references,
      urls: [] as IUrl[],
      comments: '',
    });
  };

  const loadFormValuesWithUrlsData = () => {
    setRecordOriginalFormValues((prev) => ({
      ...prev,
      urls: urlsData,
    }));
  };

  // set form values when record successfully loaded
  useEffect(() => {
    if (!!data && isSuccess && data.docs?.length > 0) {
      loadFormValuesWithRecordData();
    } else if (!isLoading && error) {
      toast({ status: 'error', title: 'Error fetching record.' });
    } else if (!isLoading && data && data.docs.length === 0) {
      toast({ status: 'error', title: 'Record not found' });
    }
  }, [data, isSuccess, error, isLoading]);

  // set urls in form
  useEffect(() => {
    if (!!urlsData && urlsIsSuccess) {
      loadFormValuesWithUrlsData();
    } else if (urlsIsError) {
      toast({ status: 'error', title: 'Error fetching urls.' });
    }
  }, [urlsData, urlsIsSuccess, urlsIsError]);

  // open preview when params set
  useEffect(() => {
    if (params !== null) {
      openPreview();
    }
  }, [params]);

  // clear params when preview closed
  useEffect(() => {
    if (!isPreviewOpen) {
      setParams(null);
    }
  }, [isPreviewOpen]);

  const handleReset = (values: FormValues, helpers: FormikHelpers<FormValues>) => {
    // if creating new record, empty the form
    if (isNew) {
      helpers.setValues(intialFormValues);
    } else if (data && isSuccess) {
      // if editing existing record and a valid record has been loaded
      // reset to original record values
      loadFormValuesWithRecordData();
      if (!!urlsData && urlsIsSuccess) {
        loadFormValuesWithUrlsData();
      }
    }
  };

  const handlePreview = (values: FormValues) => {
    if (!isNew) {
      setDiffSections(getDiffSections(recordOriginalFormValues, values));
    }

    const { email, name } = values;
    const diffString = isNew ? '' : getDiffString(recordOriginalFormValues, values);

    setParams({
      origin: 'user_submission',
      'g-recaptcha-response': null,
      _subject: `${isNew ? 'New' : 'Updated'} Record`,
      original: processFormValues(recordOriginalFormValues),
      new: processFormValues(values),
      name,
      email,
      diff: diffString,
    });
  };

  // submitted
  const handleOnSuccess = () => {
    onOpenAlert({ status: 'success', title: 'Feedback submitted successfully' });
    if (isNew) {
      formikRef.current.resetForm();
    } else {
      // reset will clear the form, but still show all fields just emptied
      // for existing record, reset the values will hide all fields expcet bibcode
      formikRef.current.setValues(intialFormValues);
    }
    setLoadById(null);
  };

  // submission error
  const handleError = (error: string) => {
    onOpenAlert({ status: 'error', title: error });
  };

  return (
    <Formik
      initialValues={recordOriginalFormValues}
      enableReinitialize
      onSubmit={handlePreview}
      onReset={handleReset}
      innerRef={formikRef}
    >
      {({ values }) => (
        <>
          <Form>
            <Stack direction="column" gap={4} m={0}>
              <Flex direction="row" gap={2} alignItems="start">
                <Field name="name">
                  {({ field }: FieldProps) => (
                    <FormControl isRequired>
                      <FormLabel>Name</FormLabel>
                      <Input {...field} ref={nameFieldRef} />
                    </FormControl>
                  )}
                </Field>

                <Field name="email">
                  {({ field }: FieldProps) => (
                    <FormControl isRequired>
                      <FormLabel>Email</FormLabel>
                      <Input {...field} type="email" />
                    </FormControl>
                  )}
                </Field>
              </Flex>

              <Field name="bibcode">
                {({ field }: FieldProps<FormValues['bibcode']>) => (
                  <FormControl isRequired>
                    <FormLabel>{isNew ? `Bibcode` : `SciX-ID / DOI / Bibcode`}</FormLabel>
                    <Flex direction="row">
                      <Input {...field} />
                      {!isNew && (
                        <Button
                          size="md"
                          borderStartRadius={0}
                          borderEndRadius={2}
                          isDisabled={!field.value || field.value.length === 0}
                          onClick={() => setLoadById(values.bibcode)}
                          isLoading={loadById !== null && isLoading && urlsIsLoading}
                        >
                          Load
                        </Button>
                      )}
                    </Flex>
                  </FormControl>
                )}
              </Field>

              {(isNew || (!isNew && ((isSuccess && data.numFound > 0) || values.title?.length > 0))) && (
                <>
                  <FormControl>
                    <FormLabel>Collection</FormLabel>
                    <CheckboxGroup value={values.collection}>
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

                  <Authors />

                  <HStack gap={2} alignItems="start">
                    <Field name="publication">
                      {({ field }: FieldProps) => (
                        <FormControl isRequired>
                          <FormLabel>Publication</FormLabel>
                          <Input {...field} />
                        </FormControl>
                      )}
                    </Field>

                    <PubDate />
                  </HStack>

                  <FieldArray name="urls">
                    {({ remove, push, replace }: FieldArrayRenderProps) => (
                      <FormControl>
                        <FormLabel>URLs</FormLabel>
                        <URLTable
                          urls={values.urls}
                          onAddUrl={push}
                          onDeleteUrl={remove}
                          onUpdateUrl={replace}
                          editable
                        />
                      </FormControl>
                    )}
                  </FieldArray>

                  <Field name="abstract">
                    {({ field }: FieldProps) => (
                      <FormControl isRequired>
                        <FormLabel>Abstract</FormLabel>
                        <Textarea {...field} rows={10} />
                      </FormControl>
                    )}
                  </Field>

                  <FieldArray name="keywords">
                    {({ remove, push }: FieldArrayRenderProps) => (
                      <FormControl>
                        <FormLabel>Keywords</FormLabel>
                        <KeywordList keywords={values.keywords} onAddKeyword={push} onDeleteKeyword={remove} />
                      </FormControl>
                    )}
                  </FieldArray>

                  <FieldArray name="references">
                    {({ remove, push, replace }: FieldArrayRenderProps) => (
                      <FormControl>
                        <FormLabel>References</FormLabel>
                        <ReferencesTable
                          references={values.references}
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

                  <HStack mt={2}>
                    <Button type="submit">Preview</Button>
                    <Button type="reset" variant="outline">
                      Reset
                    </Button>
                  </HStack>
                </>
              )}
            </Stack>
          </Form>
          {/* intentionally make this remount each time so that recaptcha is regenerated */}
          {isPreviewOpen && (
            <PreviewModal
              isOpen={isPreviewOpen}
              title={isNew ? 'Preview New Record Request' : 'Preview Record Correction Request'}
              submitterInfo={JSON.stringify({ name: values.name, email: values.email }, null, 2)}
              mainContentTitle={isNew ? 'New Record' : 'Record updates'}
              mainContent={isNew ? JSON.stringify(omit(['name', 'email'], values), null, 2) : diffSections}
              onClose={closePreview}
              onSuccess={handleOnSuccess}
              onError={handleError}
              params={params}
            />
          )}
        </>
      )}
    </Formik>
  );
};

const PubDate = () => {
  useField<string>({
    name: 'pubDate',
    validate: (value: string) => {
      if (!/[\d]{4}-(((0[1-9]|1[012])(-(0[0-9]|1[0-9]|2[0-9]|3[0-1])){0,1})|(00)|(00-00))$/.test(value)) {
        return 'Not a valid date. Valid formats are YYYY-MM, YYYY-MM-DD, YYYY-00, YYYY-00-00, YYYY-MM-00';
      }
    },
  });
  return (
    <Field name="pubDate">
      {({ field, form }: FieldProps<FormValues['pubDate']>) => (
        <FormControl isRequired isInvalid={!!form.errors.pubDate && !!form.touched.pubDate}>
          <FormLabel>Publication Date</FormLabel>
          <Input {...field} placeholder="yyyy-mm-dd" />
          <FormErrorMessage>{form.errors.pubDate}</FormErrorMessage>
        </FormControl>
      )}
    </Field>
  );
};

const Authors = () => {
  // get the value of the no authors checkbox
  const [{ value: noAuthors }] = useField<boolean>('noAuthors');

  // use this to set validation function on the authors
  const [{ value: authors }] = useField<IAuthor[]>({
    name: 'authors',
    validate: (value: IAuthor[]) => {
      if (!noAuthors && (!value || value.length === 0)) {
        return 'Authors are required. Check "Abstract has no authors" box if no authors.';
      }
    },
  });
  return (
    <>
      <FieldArray name="authors">
        {({ remove, push, form, replace }: FieldArrayRenderProps) => (
          <FormControl isInvalid={!!form.errors.authors && !!form.touched.authors}>
            <FormLabel>Authors</FormLabel>
            {!noAuthors && (
              <>
                <FormErrorMessage>{form.errors.authors}</FormErrorMessage>
                <AuthorsTable
                  authors={authors}
                  onAddAuthor={push}
                  onDeleteAuthor={remove}
                  onUpdateAuthor={replace}
                  editable={true}
                />
              </>
            )}
          </FormControl>
        )}
      </FieldArray>

      <>
        {authors.length === 0 && (
          <Field name="noAuthors" type="checkbox">
            {({ field }: FieldProps) => (
              <FormControl>
                <Checkbox {...field} isChecked={field.checked}>
                  Abstract has no author(s)
                </Checkbox>
              </FormControl>
            )}
          </Field>
        )}
      </>
    </>
  );
};
