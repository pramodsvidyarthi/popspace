import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as typeformEmbed from '@typeform/embed';
import { useHistory } from 'react-router-dom';
import { TwoColLayout } from '../../Layouts/TwoColLayout/TwoColLayout';
import { Column } from '../../Layouts/TwoColLayout/Column/Column';
import { Button, makeStyles, Typography } from '@material-ui/core';
import Api from '../../utils/api';
import useQueryParams from '../../hooks/useQueryParams/useQueryParams';
import { ErrorCodes } from '../../constants/ErrorCodes';
import { ErrorInfo } from '../../types/api';
import { Page } from '../../Layouts/Page/Page';
import { getSessionToken } from '../../utils/sessionToken';

import { RouteNames } from '../../constants/RouteNames';
import SadBlobby from './images/sadblobby.png';
import { logger } from '../../utils/logger';

interface IUnsubscribeProps {}

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.brandColors.sand.regular,
  },
  container: {
    maxWidth: '440px',
  },
  body: {
    marginTop: theme.spacing(2),
    color: theme.palette.text.primary,
  },
  imageContainer: {
    maxWidth: '100%',
    maxHeight: '100%',
  },
  image: {
    display: 'block',
    width: '100%',
    maxWidth: '600px',
  },
  button: {
    marginTop: theme.spacing(4),
    width: '148px',
  },
}));

export const Unsubscribe: React.FC<IUnsubscribeProps> = (props) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorInfo>(null!);

  // get the query params from the url
  const query = useQueryParams();

  const otp = query.get('otp') || '';
  const mlid = query.get('mlid') || '';

  useEffect(() => {
    setIsLoading(true);
    Api.unsubscribeFromEmail(otp, mlid)
      .then((result: any) => {
        setIsLoading(false);
        if (!result.success) {
          if (result.errorCode === ErrorCodes.INVALID_OTP) {
            // the link is invalid, expired, or already resolved
            if (getSessionToken()) {
              // if the user is logged in, go to the dash
              history.push(`${RouteNames.ROOT}?e=${ErrorCodes.INVALID_LINK}`);
            } else {
              // the user is not logged in, something is wrong with the link
              // redirect to signin page with invalid popup message
              history.push(`${RouteNames.SIGN_IN}?e=${ErrorCodes.INVALID_LINK}`);
            }
          } else {
            // something unexpected happened with the link
            logger.warn(`Warning unsubcribing email for ${mlid}`, result.message, result.errorCode);
            setError({
              errorCode: ErrorCodes.UNEXPECTED,
            });
          }
        }
      })
      .catch((e: any) => {
        setIsLoading(false);
        logger.error(`Error unsubcribing email for ${mlid}`, e);
        setError({
          errorCode: ErrorCodes.UNEXPECTED,
          error: e,
        });
      });
  }, [history, otp, mlid, t]);

  const onClickHandler = () => {
    // create typeform pop up that will auto close the popup 3 seconds after the user
    // submits their response and then redirect to root
    const typeFormPopUp = typeformEmbed.makePopup('https://form.typeform.com/to/QPqxaB2n', {
      mode: 'popup',
      autoClose: 3,
      onClose: () => {
        history.push(RouteNames.ROOT);
      },
    });

    typeFormPopUp.open();
  };

  return (
    <Page isLoading={isLoading} error={error} className={classes.root}>
      <TwoColLayout>
        <Column centerContent={true} useColMargin={true}>
          <div className={classes.container}>
            <div>{t('pages.unsubscribe.quoteText')}</div>
            <Typography variant="h1">{t('pages.unsubscribe.title')}</Typography>
            <Typography variant="body1" className={classes.body}>
              {t('pages.unsubscribe.body')}
            </Typography>
            <Button className={classes.button} onClick={onClickHandler}>
              {t('pages.unsubscribe.button')}
            </Button>
          </div>
        </Column>
        <Column centerContent={true} hide="sm">
          <div className={classes.imageContainer}>
            <img className={classes.image} src={SadBlobby} alt={t('pages.unsubscribe.imgAltText')} />
          </div>
        </Column>
      </TwoColLayout>
    </Page>
  );
};
