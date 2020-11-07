/*
 * @Author: doramart 
 * @Date: 2019-08-16 14:51:46 
 * @Last Modified by: doramart
 * @Last Modified time: 2020-08-19 12:26:28
 */
const _ = require('lodash')
module.exports = (options, app) => {

    let routeWhiteList = [
        'logout',
        'getUserSession',
        'getSitBasicInfo',
        'adminResource/getListByPower',
        'plugin/pluginHeartBeat',
        'plugin/getPluginShopList',
        'plugin/getOneShopPlugin',
        'plugin/createInvoice',
        'plugin/checkInvoice'
    ]

    return async function authAdminPower(ctx, next) {

        // 添加插件中的白名单
        let getPluginApiWhiteList = app.getExtendApiList();
        if (!_.isEmpty(getPluginApiWhiteList) && !_.isEmpty(getPluginApiWhiteList.adminApiWhiteList) && routeWhiteList.indexOf(getPluginApiWhiteList.adminApiWhiteList.join(',')) < 0) {
            routeWhiteList = routeWhiteList.concat(getPluginApiWhiteList.adminApiWhiteList);
        }

        let resouce = await ctx.service.adminResource.find({
            isPaging: '0'
        }, {
            query: {
                source_type: '1'
            },
            attributes: ["id", "api"]
        });

        let hasPower = false;
        for (let i = 0; i < resouce.length; i++) {
            let resourceObj = resouce[i];

            let targetApi = (ctx.originalUrl).replace('/manage/', '').split("?")[0];
            if (!_.isEmpty(ctx.session.adminUserInfo)) {
                let adminPower = await ctx.helper.getAdminPower(ctx);
                if (resourceObj.api === targetApi && adminPower && adminPower.indexOf(resourceObj.id) > -1) {
                    hasPower = true;
                    break;
                } else {
                    // 没有配置但是包含在白名单内的路由校验
                    if (!_.isEmpty(routeWhiteList)) {
                        let checkWhiteRouter = _.filter(routeWhiteList, (item) => {
                            if (item.indexOf('*') > 0 && targetApi.indexOf(item.split('*')[0]) == 0) {
                                return true;
                            } else {
                                return item == targetApi;
                            }
                        })
                        if (!_.isEmpty(checkWhiteRouter)) {
                            hasPower = true;
                            break;
                        }
                    }
                }
            } else {
                break;
            }
        }

        if (!hasPower) {
            ctx.helper.renderFail(ctx, {
                message: ctx.__('label_systemnotice_nopower')
            });
        } else {
            // console.log('check power success!')
            await next();
        }

    }

}