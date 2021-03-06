/*
 * @Author: doramart 
 * @Date: 2019-08-16 14:51:46 
 * @Last Modified by: doramart
 * @Last Modified time: 2020-11-13 23:19:31
 */

const {
    authToken
} = require('@utils');
const _ = require('lodash')
module.exports = (options, app) => {

    const routeWhiteList = [
        '/admin/login',
        '/dr-admin',
    ]

    return async function authAdminToken(ctx, next) {

        ctx.session.adminUserInfo = "";
        let userToken = '';
        let getTokenFromCookie = ctx.cookies.get('admin_' + app.config.auth_cookie_name);

        if (ctx.request.method == 'GET') {
            userToken = ctx.query.token || getTokenFromCookie;
        } else if (ctx.request.method == 'POST') {
            userToken = ctx.request.body.token || getTokenFromCookie;
        }
        if (userToken) {

            let checkToken = await authToken.checkToken(userToken, app.config.encrypt_key);

            if (checkToken) {

                if (typeof checkToken == 'object') {
                    let targetUser = await ctx.service.adminUser.item({
                        query: {
                            id: checkToken.id,
                        },
                        include: 'none',
                        attributes: {
                            exclude:['password','email']
                        }
                    })
                    if (!_.isEmpty(targetUser)) {
                        // console.log('adminuser had login');
                        let {
                            userName,
                            id,
                            group,
                            editor_id
                        } = targetUser;

                        ctx.session.adminUserInfo = {
                            userName,
                            id,
                            group,
                            editor_id
                        };

                        await next();
                    } else {
                        ctx.redirect('/admin/login');
                    }
                } else {
                    ctx.redirect('/admin/login');
                }

            } else {
                ctx.redirect('/admin/login');
            }
        } else {
            // 没有配置但是包含在白名单内的路由校验
            if (!_.isEmpty(routeWhiteList)) {
                let checkWhiteRouter = _.filter(routeWhiteList, (item) => {
                    return ctx.originalUrl.indexOf(item) >= 0;
                })
                if (!_.isEmpty(checkWhiteRouter)) {
                    await next();
                }
            } else {
                ctx.redirect('/admin/login');
            }

        }

    }

}