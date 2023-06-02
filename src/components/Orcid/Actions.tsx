import { IOrcidProfileEntry } from '@api/orcid/types/orcid-profile';
import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Button,
  ButtonProps,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useToast,
  UseToastOptions,
} from '@chakra-ui/react';
import { OrcidInactiveLogo, OrcidLogo } from '@components';
import { isClaimedBySciX, isInSciX } from './Utils';
import { MenuItemProps } from '@chakra-ui/menu';
import { useUpdateWork } from '@lib/orcid/useUpdateWork';
import { useAddWorks } from '@lib/orcid/useAddWorks';
import { useRemoveWorks } from '@lib/orcid/useRemoveWorks';

export interface IActionProps {
  work: IOrcidProfileEntry;
}

const TOAST_DEFAULTS: UseToastOptions = {
  duration: 2000,
};

export const Actions = ({ work }: IActionProps) => {
  const claimedBySciX = isClaimedBySciX(work);
  const inSciX = isInSciX(work);

  return (
    <>
      {work.status ? (
        <Menu>
          <MenuButton
            as={Button}
            isDisabled={!inSciX || !claimedBySciX}
            variant="outline"
            rightIcon={<ChevronDownIcon />}
            color="gray.500"
            w={28}
          >
            <HStack spacing={1}>
              <OrcidLogo className="flex-shrink-0 w-4 h-4" aria-hidden />
              <span>Actions</span>
            </HStack>
          </MenuButton>
          <MenuList>
            <SyncToOrcidMenuItem identifier={work.identifier} isDisabled />
            <AddClaimMenuItem identifier={work.identifier} />
            <DeleteClaimMenuItem identifier={work.identifier} />
          </MenuList>
        </Menu>
      ) : (
        <AddToOrcidButton identifier={work.identifier} />
      )}
    </>
  );
};

interface IOrcidActionProps extends MenuItemProps {
  identifier: string;
}

const AddToOrcidButton = (props: ButtonProps & { identifier: string }) => {
  const { identifier, ...buttonProps } = props;
  const toast = useToast(TOAST_DEFAULTS);
  const { addWorks } = useAddWorks(
    {},
    {
      onSuccess: () => {
        toast({ status: 'success', title: 'Successfully submitted sync request' });
      },
      onError: (error) => {
        toast({ status: 'error', title: 'Unable to submit request', description: error });
      },
    },
  );

  return (
    <Button variant="outline" color="gray.500" onClick={() => addWorks([identifier])} w={28} {...buttonProps}>
      <HStack spacing={1}>
        <OrcidInactiveLogo className="flex-shrink-0 w-4 h-4" aria-hidden />
        <span>Claim</span>
      </HStack>
    </Button>
  );
};

const SyncToOrcidMenuItem = (props: IOrcidActionProps) => {
  const { identifier, ...menuItemProps } = props;
  const { updateWork } = useUpdateWork();

  return (
    <MenuItem onClick={() => updateWork(identifier)} {...menuItemProps}>
      Sync to ORCiD
    </MenuItem>
  );
};

const AddClaimMenuItem = (props: IOrcidActionProps) => {
  const { identifier, ...menuItemProps } = props;
  const toast = useToast(TOAST_DEFAULTS);
  const { addWorks } = useAddWorks(
    {},
    {
      onSuccess: () => {
        toast({ status: 'success', title: 'Successfully submitted sync request' });
      },
      onError: (error) => {
        toast({ status: 'error', title: 'Unable to submit request', description: error });
      },
    },
  );

  return (
    <MenuItem onClick={() => addWorks([identifier])} {...menuItemProps}>
      Claim from SciX
    </MenuItem>
  );
};
const DeleteClaimMenuItem = (props: IOrcidActionProps) => {
  const { identifier, ...menuItemProps } = props;
  const toast = useToast(TOAST_DEFAULTS);
  const { removeWorks } = useRemoveWorks(
    {},
    {
      onSuccess: () => {
        toast({ status: 'success', title: 'Successfully submitted remove claim request' });
      },
      onError: (error) => {
        toast({ status: 'error', title: 'Unable to submit request', description: error });
      },
    },
  );

  return (
    <MenuItem onClick={() => removeWorks([identifier])} {...menuItemProps}>
      Delete claim from SciX
    </MenuItem>
  );
};
