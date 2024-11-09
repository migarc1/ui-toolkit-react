/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import React from 'react'
import { ConnectButton } from './ConnectButton'
import { DesktopSettings } from './DesktopSettings'
import './Header.scss'

export interface IHeaderProps {
  kvmstate: number
  deviceId: string | null
  server: string | null
  handleConnectClick: (e: any) => void
  rotateScreen: (e: any) => void
  handleKeyCombination: (e: any) => void
  changeDesktopSettings: (settings: any) => void
  getConnectState: () => number
}

export class Header extends React.Component<IHeaderProps> {
  render (): JSX.Element {
    return (
      <React.Fragment>
        <div className="header">
        <ConnectButton
            handleConnectClick={this.props.handleConnectClick}
            kvmstate={this.props.kvmstate}
          />
          <label>Screen:</label>
          <select>
          <option value="">Screen 1</option>
        </select>
        <DesktopSettings
            changeDesktopSettings={this.props.changeDesktopSettings}
            getConnectState={this.props.getConnectState}
          />

          <label>SendKeys:</label>
          <select onChange={this.props.handleKeyCombination}>
          <option value="">Select a key combination</option>
          <option value="1">Ctrl + Alt + Delete</option>
          <option value="2">Alt + Tab</option>
          <option value="3">Alt + F4</option>
          <option value="4">Ctrl + Shift + Esc</option>
        </select>
          <button className='rotate' onClick={this.props.rotateScreen}>↺</button>
        </div>
      </React.Fragment>
    )
  }
}
