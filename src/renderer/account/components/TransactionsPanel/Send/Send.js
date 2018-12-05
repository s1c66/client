import React from 'react';
import BigNumber from 'bignumber.js';
import classNames from 'classnames';
import { func, string, number, bool, objectOf } from 'prop-types';
import { wallet } from '@cityofzion/neon-js';
import { map, noop } from 'lodash';

import PrimaryButton from 'shared/components/Forms/PrimaryButton';
import LabeledInput from 'shared/components/Forms/LabeledInput';
import LabeledSelect from 'shared/components/Forms/LabeledSelect';

import ConversionInput from './ConversionInput';
import PriorityFee from './PriorityFee';
import TokenItem from './TokenItem';
import isNumeric from '../../../util/isNumeric';
import balanceShape from '../../../shapes/balanceShape';
import styles from './Send.scss';

export default class Send extends React.PureComponent {
  static propTypes = {
    className: string,
    loading: bool.isRequired,
    confirm: func.isRequired,
    asset: string.isRequired,
    amount: string,
    receiver: string,
    fee: string,
    setAmount: func,
    setReceiver: func,
    setAsset: func,
    onSend: func,
    balances: objectOf(balanceShape).isRequired,
    prices: objectOf(number).isRequired
  };

  static defaultProps = {
    className: null,
    amount: '',
    receiver: '',
    fee: '0',
    setAmount: noop,
    setReceiver: noop,
    setAsset: noop,
    onSend: noop
  };

  render() {
    const { className, loading, amount, receiver, asset, prices } = this.props;
    const assetBalance = this.getAsset();

    return (
      <form className={classNames(styles.send, className)}>
        <LabeledSelect
          id="asset"
          label="Token to send"
          placeholder="Select token"
          value={asset}
          items={this.getAssetItems()}
          renderItem={TokenItem}
          onChange={this.handleChangeAsset}
        />
        <ConversionInput
          asset={assetBalance}
          price={prices[assetBalance.symbol]}
          amount={amount}
          onChange={this.handleChangeAmount}
        />
        <LabeledInput
          id="recipient"
          label="Recipient"
          placeholder="Wallet address"
          value={receiver}
          onChange={this.handleChangeRecipient}
        />
        <PriorityFee
          className={styles.fee}
          fee={this.props.fee}
        />
        <PrimaryButton
          className={styles.next}
          type="submit"
          disabled={loading || !this.isValid()}
          onClick={this.handleTransfer}
        >
          Next
        </PrimaryButton>
      </form>
    );
  }

  handleTransfer = () => {
    const { confirm, receiver } = this.props;
    const symbol = this.getSymbol();

    confirm((
      <span>
        Would you like to transfer {this.getAmount()} {symbol} to address{' '}
        <strong>&ldquo;{receiver}&rdquo;</strong>?
      </span>
    ), {
      title: 'Transfer',
      onConfirm: this.handleConfirm,
      onCancel: noop
    });
  }

  handleConfirm = () => {
    const { onSend, asset, receiver } = this.props;
    const amount = this.getAmount();

    onSend({ asset, amount, receiver });
  };

  handleChangeAsset = (value) => {
    this.props.setAsset(value);
  };

  handleChangeAmount = (value) => {
    this.props.setAmount(value);
  };

  handleChangeRecipient = (event) => {
    this.props.setReceiver(event.target.value);
  };

  getAssetItems = () => {
    return map(this.props.balances, ({ symbol, scriptHash, image }) => ({
      label: symbol,
      value: scriptHash,
      icon: image
    }));
  }

  getSymbol = () => {
    return this.getAsset().symbol;
  }

  getAmount = () => {
    return new BigNumber(this.props.amount).toFixed(this.getAsset().decimals);
  };

  getAsset = (scriptHash = this.props.asset) => {
    return this.props.balances[scriptHash];
  }

  isValid = () => {
    return isNumeric(this.props.amount) && wallet.isAddress(this.props.receiver);
  };
}
