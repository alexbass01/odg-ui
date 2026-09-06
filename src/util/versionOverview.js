import React from 'react'

import {
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { tableCellClasses } from '@mui/material/TableCell'
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat'
import RemoveIcon from '@mui/icons-material/Remove'
import { useTheme } from '@mui/material/styles'

import PropTypes from 'prop-types'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'


const VersionTableRow = ({
  info,
  component,
  isEditMode,
  removeDep,
}) => {
  const theme = useTheme()
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: component ? `${info.name}|${component.id}|${component.browserLocalOnly}` : info.name,
    disabled: !isEditMode,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return <TableRow ref={setNodeRef} style={style} {...attributes} {...listeners}>
    <TableCell sx={{width: '50%'}}>
      <Typography variant='caption'>{info.displayName}</Typography>
    </TableCell>
    {
      info.remoteVersion ? <>
        <TableCell sx={{width: '20%'}}>
          <Stack direction='column'>
            {
              info.localVersions.map((version, idx) => {
                return <Typography key={`${info.name}-${version}-${idx}`} variant='caption'>{version}</Typography>
              })
            }
          </Stack>
        </TableCell>
        <TableCell sx={{width: '5%'}}>
          {
            info.localVersions.some((version) => version !== info.remoteVersion) ?
              <TrendingFlatIcon sx={{float: 'center', verticalAlign: 'middle'}}/> :
              <TrendingFlatIcon sx={{float: 'center', verticalAlign: 'middle', opacity: '0.4'}}/>
          }
        </TableCell>
        <TableCell sx={{width: '20%'}}>
          {
            info.localVersions.some((version) => version !== info.remoteVersion) ?
              <Typography variant='caption'>{info.remoteVersion}</Typography> :
              <Typography variant='caption' sx={{opacity: '0.4'}}>{info.remoteVersion}</Typography>
          }
        </TableCell>
      </> : <TableCell colSpan={3} sx={{width: '45%'}}>
        <Stack direction='column'>
          {
            info.localVersions.map((version, idx) => {
              return <Typography key={`${info.name}-${version}-${idx}`} variant='caption'>{version}</Typography>
            })
          }
        </Stack>
      </TableCell>
    }
    {
      isEditMode && <TableCell sx={{width: '5%'}}>
        <IconButton size={'small'} onClick={(e) => removeDep(e, info.name)}>
          <RemoveIcon sx={{fontSize: '70%', color: theme.bomButton.color}}/>
        </IconButton>
      </TableCell>
    }
  </TableRow>
}
VersionTableRow.displayName = 'VersionTableRow'
VersionTableRow.propTypes = {
  info: PropTypes.object,
  component: PropTypes.object,
  isEditMode: PropTypes.bool,
  removeDep: PropTypes.func,
}


export const VersionOverview = ({
  component,
  dependencies,
  removeDepFromComp,
  specialComponentsFeature,
  colorOverride,
  isEditMode,
  isLoading,
}) => {
  const versionInfos = dependencies ? [...dependencies.sort((a, b) => a.position - b.position)] : []
  const loadingRowsCount = 4

  if (isLoading) return <Stack
    spacing={0}
    direction='column'
  >
    {
      [...Array(loadingRowsCount).keys()].map(e => <Skeleton key={e}/>)
    }
  </Stack>

  const removeDep = (e, depName) => {
    e.preventDefault()
    removeDepFromComp(depName, component)
    specialComponentsFeature.triggerRerender()
  }

  return <Table
    padding='checkbox'
    sx={{
      [`& .${tableCellClasses.root}`]: {borderBottom: 'none', color: colorOverride},
      borderCollapse: 'separate',
      borderSpacing: '0 0.2rem',
    }}
  >
    {
      versionInfos.length > 0 && <TableHead>
        <TableRow>
          <TableCell sx={{width: '50%'}} visibility='hidden'/>
          <TableCell sx={{width: '20%'}}>
            <Typography>{'Component'}</Typography>
          </TableCell>
          <TableCell sx={{width: '5%'}} visibility='hidden'/>
          {
            versionInfos.find((info) => info.remoteVersion) && <TableCell sx={{width: '20%'}}>
              <Typography>{'Repository'}</Typography>
            </TableCell>
          }
          <TableCell sx={{width: '5%'}} visibility='hidden'/>
        </TableRow>
      </TableHead>
    }
    <TableBody>
      {versionInfos.map((info) => {
        return <VersionTableRow
          key={`version-info-${info.name}`}
          info={info}
          component={component}
          isEditMode={isEditMode}
          removeDep={removeDep}
        />
      })}
    </TableBody>
  </Table>
}
VersionOverview.displayName = 'VersionOverview'
VersionOverview.propTypes = {
  component: PropTypes.object,
  dependencies: PropTypes.array,
  removeDepFromComp: PropTypes.func,
  specialComponentsFeature: PropTypes.object,
  colorOverride: PropTypes.string,
  isEditMode: PropTypes.bool,
  isLoading: PropTypes.bool,
}

export const evaluateVersionMatch = (
  dependencies,
) => {
  return !dependencies.some((dep) => {
    return dep.remoteVersion && dep.localVersions.some((version) => version !== dep.remoteVersion)
  })
}
