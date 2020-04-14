import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

import SpikeStreaming from './SpikeStreaming';


const useStyles = makeStyles((theme) => ({
  root: {
    '& > *': {
      margin: theme.spacing(1),
    },
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh'
  },
  top: {
    position: 'absolute',
    left: theme.spacing(1),
    top: theme.spacing(1),
    'z-index': 10,
  }
}));


export default function InsiteNestPlot() {
  const classes = useStyles();
  const [streaming, setStreaming] = React.useState(false);
  const [url, setUrl] = React.useState('http://localhost:8080')

  if (streaming) {
    return (
      <div className="App">
        <div className={classes.top}>
          <Typography color="textPrimary">
            <IconButton
              size="small"
              aria-label="back"
              onClick={() => setStreaming(false)}>
              <ArrowBackIcon />
            </IconButton>
            <span style={{margin:8}}>{url}</span>
          </Typography>
        </div>
        <SpikeStreaming url={url} />
      </div>
    )
  } else {
    return (
      <div className={classes.center}>
        <div className={classes.root}>
          <Typography style={{fontSize:20, fontWeight:'bold'}}>
            Insite NEST plot
          </Typography>
          <div className={classes.root} />
          <form noValidate autoComplete="off">
            <TextField
              id="standard-basic"
              label="Url"
              defaultValue={url}
              onChange={(e => setUrl(e.target.value))}
            />
          </form>
          <Button variant="outlined" onClick={() => setStreaming(true)}>
            Stream
          </Button>
        </div>
      </div>
    )
  }
}
