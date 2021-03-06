// pages/index/pay.js
const host = require('../../config').host
Page({

  /**
   * 页面的初始数据
   */
  data: {
    action: '',
    key: 0,
    trade: 0,
    amount: 0,
    use_recharge: 0,
    use_point: 0,
    consume_recharge: 0,
    consume_point: 0,
    is_member: false,
    interval: '',
    radio_none_checked: false,
    pay_disabled: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    if (!options.hasOwnProperty('q')) {
      wx.switchTab({
        url: 'index',
      })
    }
    wx.showLoading({
      title: '加载中',
    })
    var url = decodeURIComponent(options.q)
    var params = url.split('&')
    var action_param = params[0].split('=')
    var key_param = params[1].split('=')
    var action = action_param[1]
    var key = key_param[1]
    var shop_id = key_param[2]
    this.data.key = key
    this.data.action = action
    this.data.shop_id = shop_id
    var that = this
    this.data.interval = setInterval(
      function() {
        if (wx.getStorageSync('openid')) {
          clearInterval(that.data.interval)
          that.get_detail()
        }
      }, 200);
  },
  get_detail: function(e) {
    var key = this.data.key
    var that = this
    var member = wx.getStorageSync('member')
    wx.request({
      url: host + 'pay.php?action=get_detail',
      data: {
        sub_openid: wx.getStorageSync('openid'),
        pay_action: that.data.action,
        key: key,
        grade: member.grade
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        wx.hideLoading()
        if (!res.data.trade) {
          wx.showModal({
            title: '支付已经过期',
            content: '',
            success(res) {
              wx.reLaunch({
                url: 'index',
              })
            }
          })
        }
        that.setData({
          pay_disabled:false,
          key: key,
          trade: res.data.trade,
          get_point: res.data.get_point,
          consume: res.data.consume,
          award_coupon_id: res.data.award_coupon_id,
          award_coupon_name: res.data.award_coupon_name,
          award_coupon_total: res.data.award_coupon_total,
          member_coupons: res.data.member_coupons,
          recharge: member ? member.recharge : 0,
          point: member ? member.point : 0,
          use_coupon_id: 0,
          use_coupon_amount: 0,
          use_coupon_name: '',
          save: res.data.save,
          point_amount: 0,
          reduce: res.data.reduce,
          discount: res.data.discount,
          member_discount: res.data.member_discount,
          grade_title: member ? member.grade_title : '',
          point_speed: res.data.point_speed,
          point_title: res.data.point_title,
          reduce_title: res.data.reduce_title,
          discount_title: res.data.discount_title,
          can_cash: res.data.can_cash,
          exchange_need_points: res.data.exchange_need_points,
          award_title: res.data.award_title,
          payed_share: res.data.payed_share,
          recharge_point: 0,
          mch_id: res.data.mch_id
        })
      }
    })
  },
  checkboxChange: function(e) {
    var that = this
    var length = e.detail.value.length
    var obj = e.detail.value
    this.setData({
      'use_recharge': 0,
      'use_point': 0
    })
    for (var i = 0; i < length; i++) {
      if ('use_recharge' == obj[i]) {
        that.setData({
          'use_recharge': that.data.recharge
        })
      } else if ('use_point' == obj[i]) {
        that.setData({
          'use_point': that.data.point
        })
      }
    }
    that.refreshTrade()
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },
  getWebsocketMessage: function(wssurl) {
    var that = this
    wx.connectSocket({
      url: wssurl,
      success: function() {
        wx.onSocketOpen(function(res) {
          //console.log("websocket连接服务器成功")
        })
        wx.onSocketMessage(function(res) {
          var message = res.data
          var result = JSON.parse(message);
          wx.vibrateLong()
          if (result.pay == 'verify_completed') {
            if (result.verify_confirmed == true) {
              that.data.use_coupon_amount = result.coupon_amount
              that.refreshTrade()
              wx.hideLoading()
            } else {
              wx.hideLoading()
              wx.showModal({
                title: '该券不可用',
                content: '',
                success(res) {
                  that.setData({
                    radio_none_checked: true
                  })
                }
              })
            }
          }
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {
    if ('scan' == this.data.action) {
      this.closeWebsocket()
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    if ('scan' == this.data.action) {
      this.closeWebsocket()
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },
  refreshTrade: function() {
    var that = this
    var is_member = wx.getStorageSync('is_member')
    var member = wx.getStorageSync('member')
    wx.request({
      url: host + 'pay.php?action=refresh_detail',
      data: {
        sub_openid: wx.getStorageSync('openid'),
        openid: is_member ? member.openid : '',
        key: that.data.key,
        is_member: true,
        grade: is_member ? member.grade : 0,
        pay_action: that.data.action,
        use_coupon_amount: that.data.use_coupon_amount,
        use_recharge: that.data.use_recharge,
        use_point: that.data.use_point
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        that.setData({
          trade: res.data.trade,
          point_amount: res.data.point_amount,
          consume_point: res.data.consume_point,
          get_point: res.data.get_point,
          consume: res.data.consume,
          award_coupon_id: res.data.award_coupon_id,
          award_coupon_name: res.data.award_coupon_name,
          award_coupon_total: res.data.award_coupon_total,
          consume_recharge: res.data.consume_recharge,
          consume_point: res.data.consume_point,
          save: res.data.save,
          reduce: res.data.reduce,
          discount: res.data.discount,
          point_speed: res.data.point_speed,
          recharge_point_speed: res.data.recharge_point_speed,
          recharge_point: res.data.recharge_point,
          recharge_point_title: res.data.recharge_point_title
        })
      }
    })
  },
  useCouponChange: function(e) {
    var that = this
    var member_coupons = this.data.member_coupons
    var coupon_id = e.detail.value
    for (var i = 0; i < member_coupons.length; i++) {
      var obj = member_coupons[i]
      if (obj.coupon_id == coupon_id) {
        var coupon_type = obj.coupon_type
        var discount = obj.discount
        var name = obj.coupon_name
        var amount = obj.amount
      }
    }

    if ('discount' == coupon_type) {
      //优惠券折扣在会员折扣买单折扣后计算
      var consume = this.data.trade - this.data.member_discount - this.data.discount
      var coupon_amount = consume * (10 - discount) / 10
      coupon_amount = coupon_amount.toFixed(2)
    } else {
      coupon_amount = amount
    }

    this.setData({
      use_coupon_id: coupon_id,
      use_coupon_amount: coupon_amount,
      use_coupon_name: name
    })
    if ('gift' == coupon_type) {
      wx.showModal({
        title: '该券需要店员确认',
        content: '点击确定发送给店员确认',
        success(res) {
          if (res.confirm) {
            wx.showLoading({
              title: '店员核实中',
              mask: true,
              success(res) {
                var post_data = {
                  pay: 'verify',
                  key: that.data.key,
                  coupon_name: that.data.use_coupon_name,
                  coupon_amount: that.data.use_coupon_amount
                }
                var message = JSON.stringify(post_data)
                that.websocket_sendmessage(message)
              }
            })
          } else if (res.cancel) {
            that.setData({
              radio_none_checked: true
            })
            return;
          }
        }
      })
    } else {
      this.refreshTrade()
    }
  },
  submit: function(e) {
    this.setData({
      pay_disabled: true
    })
    var id = e.detail.value.id
    var consume = e.detail.value.consume
    var trade = this.data.trade
    var formId = e.detail.formId
    var that = this

    if (consume > 0) {
      wx.request({
        url: host + 'pay.php?action=getPrepay',
        data: {
          openid: wx.getStorageSync('openid'),
          trade: trade,
          get_point: that.data.get_point,
          consume: that.data.consume,
          use_coupon_id: that.data.use_coupon_id,
          use_coupon_amount: that.data.use_coupon_amount,
          use_coupon_name: that.data.use_coupon_name,
          consume_recharge: that.data.consume_recharge,
          consume_point: that.data.consume_point,
          point_amount: that.data.point_amount,
          use_point: that.data.use_point,
          reduce: that.data.reduce,
          save: that.data.save,
          discount: that.data.discount,
          member_discount: that.data.member_discount,
          key: that.data.key,
          is_member: true,
          award_coupon_id: that.data.award_coupon_id,
          award_coupon_name: that.data.award_coupon_name,
          award_coupon_total: that.data.award_coupon_total,
          pay_action: that.data.action
        },
        header: {
          'content-type': 'application/json'
        },
        success: function(res) {
          var payargs = res.data
          var out_trade_no = res.data.out_trade_no
          wx.requestPayment({
            'timeStamp': payargs.timeStamp,
            'nonceStr': payargs.nonceStr,
            'package': payargs.package,
            'signType': payargs.signType,
            'paySign': payargs.paySign,
            'success': function(res) {
              if ('ordering' == that.data.action) {
                setTimeout(function(){ 
                  wx.reLaunch({
                    url: '../order/detail?out_trade_no='+ out_trade_no,
                  })
                }, 1000);
              } else {
                wx.redirectTo({
                  url: 'paydirect?key='+that.data.key+'&consume=' + that.data.consume + '&is_member=' + wx.getStorageSync('is_member'),
                })
              }
            },
            'complete': function(res) {
              that.setData({
                pay_disabled:false
              })
            }
          })
        }
      })
    } else {
      wx.showModal({
        title: '请确认',
        content: '本次消费共使用储值余额' + that.data.consume_recharge + '元',
        success(res) {
          if (res.confirm) {
            wx.request({
              url: host + 'pay.php?action=consume_no_money',
              data: {
                openid: wx.getStorageSync('openid'),
                key: that.data.key,
                trade: trade,
                use_coupon_id: that.data.use_coupon_id,
                use_coupon_amount: that.data.use_coupon_amount,
                use_coupon_name: that.data.use_coupon_name,
                use_recharge: that.data.use_recharge,
                use_point: that.data.use_point,
                consume_recharge: that.data.consume_recharge,
                consume_point: that.data.consume_point,
                point_amount: that.data.point_amount,
                use_point: that.data.use_point,
                reduce: that.data.reduce,
                save: that.data.save,
                discount: that.data.discount,
                member_discount: that.data.member_discount,
                formId: formId,
                consume: 0,
                cash_fee:0,
                get_point: that.data.recharge_point,
                pay_action: that.data.action

              },
              success: function(res) {
                var out_trade_no = res.data.out_trade_no
                wx.showModal({
                  title: '付款成功',
                  content: '',
                  success(res) {
                    if ('ordering' == that.data.action) {
                      setTimeout(function(){ 
                        wx.reLaunch({
                          url: '../order/detail?out_trade_no='+ out_trade_no,
                        })
                      }, 1000)
                    } else {
                      wx.switchTab({
                        url: '../index/index'
                      })
                    }
                  }
                })
              }
            })
          } else {
            /*that.setData({
              pay_disabled:false
            })*/
          }
        }
      })
    }
  },
  closeWebsocket() {
    var that = this;
    wx.closeSocket()
    wx.onSocketClose(function(res) {})
  },
  websocket_sendmessage(message) {
    var that = this;
    wx.request({
      url: host + 'pay.php?action=send_websocket_message',
      data: {
        channel: that.data.key,
        message: message
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {}
    })
  }
})
