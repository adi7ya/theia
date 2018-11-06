/********************************************************************************
 * Copyright (C) 2018 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { AbstractViewContribution, KeybindingRegistry, LabelProvider, CommonMenus, FrontendApplication, FrontendApplicationContribution } from '@theia/core/lib/browser';
import { SearchInWorkspaceWidget } from './search-in-workspace-widget';
import { injectable, inject } from 'inversify';
import { CommandRegistry, MenuModelRegistry, SelectionService, Command } from '@theia/core';
import { NAVIGATOR_CONTEXT_MENU } from '@theia/navigator/lib/browser/navigator-contribution';
import { UriCommandHandler, UriAwareCommandHandler } from '@theia/core/lib/common/uri-command-handler';
import URI from '@theia/core/lib/common/uri';
import { WorkspaceService } from '@theia/workspace/lib/browser';

export namespace SearchInWorkspaceCommands {
    const SEARCH_CATEGORY = 'Search';
    export const TOGGLE_SIW_WIDGET = {
        id: 'search-in-workspace.toggle'
    };
    export const OPEN_SIW_WIDGET: Command = {
        id: 'search-in-workspace.open',
        category: SEARCH_CATEGORY,
        label: 'Find in Files'

    };
    export const FIND_IN_FOLDER: Command = {
        id: 'search-in-workspace.in-folder',
        category: SEARCH_CATEGORY,
        label: 'Find in Folder...'
    };
}

@injectable()
export class SearchInWorkspaceFrontendContribution extends AbstractViewContribution<SearchInWorkspaceWidget> implements FrontendApplicationContribution {

    @inject(SelectionService) protected readonly selectionService: SelectionService;
    @inject(LabelProvider) protected readonly labelProvider: LabelProvider;
    @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService;

    constructor() {
        super({
            widgetId: SearchInWorkspaceWidget.ID,
            widgetName: SearchInWorkspaceWidget.LABEL,
            defaultWidgetOptions: {
                area: 'left'
            },
            toggleCommandId: SearchInWorkspaceCommands.TOGGLE_SIW_WIDGET.id
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false });
    }

    registerCommands(commands: CommandRegistry): void {
        super.registerCommands(commands);
        commands.registerCommand(SearchInWorkspaceCommands.OPEN_SIW_WIDGET, {
            isEnabled: () => this.workspaceService.tryGetRoots().length > 0,
            execute: () => this.openView({
                activate: true
            })
        });

        commands.registerCommand(SearchInWorkspaceCommands.FIND_IN_FOLDER, this.newUriAwareCommandHandler({
            execute: async fileUri => {
                const widget: SearchInWorkspaceWidget = await this.openView({
                    activate: true
                });
                const uriStr = this.labelProvider.getLongName(fileUri);
                widget.findInFolder(uriStr);
            }
        }));
    }

    registerKeybindings(keybindings: KeybindingRegistry): void {
        super.registerKeybindings(keybindings);
        keybindings.registerKeybinding({
            command: SearchInWorkspaceCommands.OPEN_SIW_WIDGET.id,
            keybinding: 'ctrlcmd+shift+f'
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        super.registerMenus(menus);
        menus.registerMenuAction([...NAVIGATOR_CONTEXT_MENU, '6_find'], {
            commandId: SearchInWorkspaceCommands.FIND_IN_FOLDER.id
        });
        menus.registerMenuAction(CommonMenus.EDIT_FIND, {
            commandId: SearchInWorkspaceCommands.OPEN_SIW_WIDGET.id
        });
    }

    protected newUriAwareCommandHandler(handler: UriCommandHandler<URI>): UriAwareCommandHandler<URI> {
        return new UriAwareCommandHandler(this.selectionService, handler);
    }
}
