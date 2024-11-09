/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/

import { AMTDesktop, AMTKvmDataRedirector, DataProcessor, ImageHelper, KeyBoardHelper, MouseHelper, Protocol, type Desktop, type IDataProcessor, type IKvmDataCommunicator, type RedirectorConfig } from '@open-amt-cloud-toolkit/ui-toolkit/core'
import React from 'react'
import { isFalsy } from '../shared/Utilities'
import { Header } from './Header'
import { PureCanvas } from './PureCanvas'

import './UI.scss'

export interface KVMProps {
  deviceId: string | null
  mpsServer: string | null
  mouseDebounceTime: number
  canvasHeight: string
  canvasWidth: string
  autoConnect?: boolean
  authToken: string | null
}

export class KVM extends React.Component<KVMProps, { kvmstate: number, encodingOption: number, rotation: number }> {
  module: Desktop | any
  dataProcessor: IDataProcessor | any
  redirector: IKvmDataCommunicator | any
  mouseHelper: MouseHelper | any
  keyboard: KeyBoardHelper | any
  desktopSettingsChange = false
  ctx: CanvasRenderingContext2D
  fr: FileReader
  constructor (props: KVMProps) {
    super(props)
    this.state = { kvmstate: 0, encodingOption: 1, rotation: 0 }
    this.saveContext = this.saveContext.bind(this)
    this.startKVM = this.startKVM.bind(this)
    this.stopKVM = this.stopKVM.bind(this)
    this.handleConnectClick = this.handleConnectClick.bind(this)
    this.rotateScreen = this.rotateScreen.bind(this)
    this.handleKeyCombination = this.handleKeyCombination.bind(this)
    this.getRenderStatus = this.getRenderStatus.bind(this)
    this.OnConnectionStateChange = this.OnConnectionStateChange.bind(this)
    this.changeDesktopSettings = this.changeDesktopSettings.bind(this)
    this.sendCtrlAltDelete = this.sendCtrlAltDelete.bind(this)
    this.sendAltTab = this.sendAltTab.bind(this)
    this.sendAltF4 = this.sendAltF4.bind(this)
    this.sendCtrlShiftEsc = this.sendCtrlShiftEsc.bind(this)
  }

  saveContext (ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx
    this.init()
  }

  init (): void {
    const deviceUuid: string = this.props.deviceId ?? ''
    const server: string = this.props.mpsServer != null ? this.props.mpsServer.replace('http', 'ws') : ''
    const config: RedirectorConfig = {
      mode: 'kvm',
      protocol: Protocol.KVM,
      fr: new FileReader(),
      host: deviceUuid,
      port: 16994,
      user: '',
      pass: '',
      tls: 0,
      tls1only: 0,
      authToken: this.props.authToken ?? '',
      server
    }
    console.log('server', server)
    console.log('deviceUuid', deviceUuid)
    console.log('authToken', this.props.authToken)
    this.module = new AMTDesktop(this.ctx)
    this.redirector = new AMTKvmDataRedirector(config)
    this.dataProcessor = new DataProcessor(this.redirector, this.module)
    this.mouseHelper = new MouseHelper(this.module, this.redirector, this.props.mouseDebounceTime < 200 ? 200 : this.props.mouseDebounceTime) // anything less than 200 ms causes timeout
    this.keyboard = new KeyBoardHelper(this.module, this.redirector)

    this.redirector.onProcessData = this.module.processData.bind(this.module)
    this.redirector.onStart = this.module.start.bind(this.module)
    this.redirector.onNewState = this.module.onStateChange.bind(this.module)
    this.redirector.onSendKvmData = this.module.onSendKvmData.bind(this.module)
    this.redirector.onStateChanged = this.OnConnectionStateChange.bind(this)
    this.redirector.onError = this.onRedirectorError.bind(this)
    this.module.onSend = this.redirector.send.bind(this.redirector)
    this.module.onProcessData = this.dataProcessor.processData.bind(this.dataProcessor)
    this.module.bpp = this.state.encodingOption
  }

  cleanUp (): void {
    this.module = null
    this.redirector = null
    this.dataProcessor = null
    this.mouseHelper = null
    this.keyboard = null
    this.ctx.clearRect(0, 0, this.ctx.canvas.height, this.ctx.canvas.width)
  }

  componentWillUnmount (): void {
    this.stopKVM()
  }

  onRedirectorError (): void {
    this.reset()
  }

  reset (): void {
    this.cleanUp()
    this.init()
  }

  OnConnectionStateChange (redirector: any, state: number): any {
    this.setState({ kvmstate: state })
    if (this.desktopSettingsChange && state === 0) {
      this.desktopSettingsChange = false
      setTimeout(() => { this.startKVM() }, 2000) // Introduced delay to start KVM
    }
  }

  changeDesktopSettings (settings: any): void {
    if (this.state.kvmstate === 2) {
      this.desktopSettingsChange = true
      this.module.bpp = settings.encoding
      this.stopKVM()
    } else {
      this.setState({
        encodingOption: parseInt(settings.encoding)
      })
      this.module.bpp = parseInt(settings.encoding)
    }
  }

  startKVM (): void {
    if (typeof this.redirector !== 'undefined') {
      // console.log("startKVM")
      this.redirector.start(WebSocket)
    }
    if (typeof this.keyboard !== 'undefined') this.keyboard.GrabKeyInput()
  }

  stopKVM (): void {
    if (typeof this.redirector !== 'undefined') this.redirector.stop()
    if (typeof this.keyboard !== 'undefined') this.keyboard.UnGrabKeyInput()
    this.reset()
  }

  getRenderStatus (): any {
    return this.module.state // used to check if canvas is in the middle of rendering a complete frame.
  }

  handleConnectClick (e): void {
    e.persist()
    if (this.state.kvmstate === 0) {
      this.startKVM()
    } else if (this.state.kvmstate === 1) {
      // Take Action
    } else if (this.state.kvmstate === 2) {
      this.stopKVM()
    } else {
      // Take Action
    }
  }

  rotateScreen (): void {
    this.setState({ rotation: (this.state.rotation + 1) % 4 }, () => {
      ImageHelper.setRotation(this.module, (this.state.rotation))
    })
  }

  handleKeyCombination (event: any): void {
    const value = event.target.value
    switch (value) {
      case '1':
        this.sendCtrlAltDelete()
        break
      case '2':
        this.sendAltTab()
        break
      case '3':
        this.sendAltF4()
        break
      case '4':
        this.sendCtrlShiftEsc()
        break
      default:
        break
    }
  }

  sendCtrlAltDelete () {
    this.keyboard.handleKeyEvent(1, { keyCode: 17, code: 'ControlLeft', shiftKey: false })
    this.keyboard.handleKeyEvent(1, { keyCode: 18, code: 'AltLeft', shiftKey: false })
    this.keyboard.handleKeyEvent(1, { keyCode: 46, code: 'Delete', shiftKey: false })
    this.keyboard.handleKeyEvent(0, { keyCode: 46, code: 'Delete', shiftKey: false })
    this.keyboard.handleKeyEvent(0, { keyCode: 18, code: 'AltLeft', shiftKey: false })
    this.keyboard.handleKeyEvent(0, { keyCode: 17, code: 'ControlLeft', shiftKey: false })
  }

  // Function to send Alt + Tab key combination
  sendAltTab () {
    this.keyboard.handleKeyEvent(1, { keyCode: 18, code: 'AltLeft', shiftKey: false })
    this.keyboard.handleKeyEvent(1, { keyCode: 9, code: 'Tab', shiftKey: false })
    this.keyboard.handleKeyEvent(0, { keyCode: 9, code: 'Tab', shiftKey: false })
    this.keyboard.handleKeyEvent(0, { keyCode: 18, code: 'AltLeft', shiftKey: false })
  }

  // Function to send Alt + F4 key combination
  sendAltF4 () {
    this.keyboard.handleKeyEvent(1, { keyCode: 18, code: 'AltLeft', shiftKey: false })
    this.keyboard.handleKeyEvent(1, { keyCode: 115, code: 'F4', shiftKey: false })
    this.keyboard.handleKeyEvent(0, { keyCode: 115, code: 'F4', shiftKey: false })
    this.keyboard.handleKeyEvent(0, { keyCode: 18, code: 'AltLeft', shiftKey: false })
  }

  // Function to send Ctrl + Shift + Esc key combination
  sendCtrlShiftEsc () {
    this.keyboard.handleKeyEvent(1, { keyCode: 17, code: 'ControlLeft', shiftKey: false })
    this.keyboard.handleKeyEvent(1, { keyCode: 16, code: 'ShiftLeft', shiftKey: false })
    this.keyboard.handleKeyEvent(1, { keyCode: 27, code: 'Escape', shiftKey: false })
    this.keyboard.handleKeyEvent(0, { keyCode: 27, code: 'Escape', shiftKey: false })
    this.keyboard.handleKeyEvent(0, { keyCode: 16, code: 'ShiftLeft', shiftKey: false })
    this.keyboard.handleKeyEvent(0, { keyCode: 17, code: 'ControlLeft', shiftKey: false })
  }

  componentDidUpdate (prevProps): void {
    if (prevProps.deviceId !== this.props.deviceId) {
      this.stopKVM()
    }
  }

  render (): React.ReactNode {
    return (
       <div className="canvas-container">
         {!isFalsy(this.props.autoConnect)
           ? (
           <Header key="kvm_header" handleConnectClick={this.handleConnectClick}
              rotateScreen={this.rotateScreen}
              handleKeyCombination={this.handleKeyCombination}
              getConnectState={() => this.state.kvmstate} kvmstate={this.state.kvmstate}
              changeDesktopSettings={this.changeDesktopSettings}
              deviceId={this.props.deviceId}
              server={this.props.mpsServer}
          />)
           : ''}
         <PureCanvas key="kvm_comp" contextRef={ctx => { this.saveContext(ctx) }} canvasHeight={this.props.canvasHeight} canvasWidth={this.props.canvasWidth}
           mouseMove={event => { if (typeof this.mouseHelper !== 'undefined') this.mouseHelper.mousemove(event) }}
           mouseDown={event => { if (typeof this.mouseHelper !== 'undefined') this.mouseHelper.mousedown(event) }}
           mouseUp={event => { if (typeof this.mouseHelper !== 'undefined') this.mouseHelper.mouseup(event) }}
         />
       </div>
    )
  }
}
