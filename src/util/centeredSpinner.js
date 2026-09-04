import React from 'react'

import { CircularProgress, Stack } from '@mui/material'

import PropType from 'prop-types'

const CenteredSpinner = (params) => {
  return (
    <Stack
      direction='column'
      {...params}
      sx={[{
        justifyContent: 'center',
        alignItems: 'center'
      }, ...(Array.isArray(params.sx) ? params.sx : [params.sx])]}>
      <CircularProgress color='inherit' disableShrink size='3.5em' />
    </Stack>
  );
}

CenteredSpinner.propType = {
  style: PropType.object,
}

export default CenteredSpinner
