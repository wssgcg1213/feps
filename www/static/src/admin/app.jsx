/**
 * Created at 16/1/2.
 * @Author Ling.
 * @Email i@zeroling.com
 */
import React from 'react';
import { Router, Route, Redirect } from 'react-router';
import createBrowserHistory from 'history/lib/createBrowserHistory';

import examplePage from './components/example';

const history = createBrowserHistory();

new Promise(resolve => {
    if (window.addEventListener) {
        window.addEventListener('DOMContentLoaded', resolve);
    } else {
        window.attachEvent('onload', resolve);
    }
}).then(() => {
    React.render((
        <Router history={ history }>
            <Route path="/admin/login" component={ examplePage } />
            <Redirect from="/admin" to="/admin/dashboard" />
            <Route path="/admin" component={ App }>
                <Route path="dashboard" component={ examplePage } />
                <Route path="category" component={ examplePage } />
                <Route path="tag" component={ examplePage } />
                <Route path="post" component={ examplePage} />
                <Route path="post/add" component={ examplePage } />
                <Route path="post/edit/:id" component={ examplePage } />
                <Route path="user" component={ examplePage } />
                <Route path="config" component={ examplePage } />
                <Redirect from="*" to="/admin/dashboard" />
            </Route>
        </Router>
    ), document.body);
});